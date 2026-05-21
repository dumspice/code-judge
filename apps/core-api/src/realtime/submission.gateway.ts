import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  socketContestRoom,
  socketSubmissionRoom,
  socketUserRoom,
} from '../common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketAuthService } from './socket-auth.service';

type AnyRecord = Record<string, unknown>;

type JoinContestBody = { contestId?: string };
type JoinSubmissionBody = { submissionId?: string };

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') ?? true,
    credentials: true,
    methods: ['GET', 'POST'],
  },
})
export class SubmissionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SubmissionGateway.name);

  constructor(
    private readonly socketAuth: SocketAuthService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(_server: Server) {
    this.logger.log('Socket.io initialized (room-scoped realtime)');
  }

  handleConnection(client: Socket) {
    const userId = this.socketAuth.resolveUserIdFromHandshake(client.handshake);
    if (!userId) {
      this.logger.debug(`Socket ${client.id} connected without auth — no user room joined`);
      client.data.userId = null;
      return;
    }

    client.data.userId = userId;
    client.join(socketUserRoom(userId));
    this.logger.debug(`Socket ${client.id} joined ${socketUserRoom(userId)}`);
  }

  handleDisconnect(client: Socket) {
    const rooms = [...(client.data.contestRooms ?? [])] as string[];
    for (const contestId of rooms) {
      client.leave(socketContestRoom(contestId));
    }
    const submissionId = client.data.submissionRoom as string | undefined;
    if (submissionId) {
      client.leave(socketSubmissionRoom(submissionId));
    }
  }

  /** Full submission lifecycle updates — only the submitter's user room. */
  emitToUser(userId: string, event: string, payload: AnyRecord) {
    this.server.to(socketUserRoom(userId)).emit(event, payload);
  }

  /** Optional: watch a single submission (same payload as user room). */
  emitToSubmission(submissionId: string, event: string, payload: AnyRecord) {
    this.server.to(socketSubmissionRoom(submissionId)).emit(event, payload);
  }

  /**
   * Leaderboard invalidation only — minimal payload, no case results or errors.
   * Clients on the leaderboard page join `contest:<contestId>`.
   */
  emitContestLeaderboardUpdated(contestId: string, payload: AnyRecord) {
    this.server.to(socketContestRoom(contestId)).emit(SOCKET_EVENTS.CONTEST_LEADERBOARD_UPDATED, payload);
  }

  @SubscribeMessage(SOCKET_EVENTS.CLIENT_JOIN_CONTEST)
  async onJoinContest(@ConnectedSocket() client: Socket, @MessageBody() body: JoinContestBody) {
    const contestId = body?.contestId;
    if (!contestId || typeof contestId !== 'string') {
      return { ok: false, error: 'contestId required' };
    }

    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      select: { id: true },
    });
    if (!contest) {
      return { ok: false, error: 'contest not found' };
    }

    const room = socketContestRoom(contestId);
    client.join(room);
    const set = new Set<string>((client.data.contestRooms as string[] | undefined) ?? []);
    set.add(contestId);
    client.data.contestRooms = [...set];

    return { ok: true, room };
  }

  @SubscribeMessage(SOCKET_EVENTS.CLIENT_LEAVE_CONTEST)
  onLeaveContest(@ConnectedSocket() client: Socket, @MessageBody() body: JoinContestBody) {
    const contestId = body?.contestId;
    if (!contestId || typeof contestId !== 'string') {
      return { ok: false, error: 'contestId required' };
    }

    client.leave(socketContestRoom(contestId));
    const set = new Set<string>((client.data.contestRooms as string[] | undefined) ?? []);
    set.delete(contestId);
    client.data.contestRooms = [...set];

    return { ok: true };
  }

  @SubscribeMessage(SOCKET_EVENTS.CLIENT_JOIN_SUBMISSION)
  async onJoinSubmission(@ConnectedSocket() client: Socket, @MessageBody() body: JoinSubmissionBody) {
    const userId = client.data.userId as string | null | undefined;
    if (!userId) {
      return { ok: false, error: 'unauthenticated' };
    }

    const submissionId = body?.submissionId;
    if (!submissionId || typeof submissionId !== 'string') {
      return { ok: false, error: 'submissionId required' };
    }

    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true },
    });
    if (!submission) {
      return { ok: false, error: 'submission not found' };
    }
    if (submission.userId !== userId) {
      return { ok: false, error: 'forbidden' };
    }

    if (client.data.submissionRoom) {
      client.leave(socketSubmissionRoom(client.data.submissionRoom as string));
    }

    const room = socketSubmissionRoom(submissionId);
    client.join(room);
    client.data.submissionRoom = submissionId;

    return { ok: true, room };
  }

  @SubscribeMessage(SOCKET_EVENTS.CLIENT_LEAVE_SUBMISSION)
  onLeaveSubmission(@ConnectedSocket() client: Socket, @MessageBody() body: JoinSubmissionBody) {
    const submissionId = body?.submissionId ?? (client.data.submissionRoom as string | undefined);
    if (!submissionId) {
      return { ok: false, error: 'submissionId required' };
    }

    client.leave(socketSubmissionRoom(submissionId));
    if (client.data.submissionRoom === submissionId) {
      client.data.submissionRoom = undefined;
    }

    return { ok: true };
  }

  @SubscribeMessage(SOCKET_EVENTS.CLIENT_HELLO)
  onHello(@ConnectedSocket() client: Socket, @MessageBody() _body: AnyRecord) {
    client.emit(SOCKET_EVENTS.CLIENT_HELLO_ACK, {
      ok: true,
      userId: client.data.userId ?? null,
    });
  }
}
