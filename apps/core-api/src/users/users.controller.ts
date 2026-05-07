import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { AvatarConfirmDto } from './dto/avatar-confirm.dto';
import { AvatarUploadDto } from './dto/avatar-upload.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: 'Tạo user mới' })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @ApiOperation({ summary: 'Danh sách user (paging + search)' })
  @Get()
  findAll(@Query() query: ListUsersDto) {
    return this.users.findAll(query);
  }

  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.users.findById(user.userId);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin user hiện tại' })
  @Patch('me')
  updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateUserDto) {
    return this.users.update(user.userId, dto);
  }

  @ApiOperation({ summary: 'Lấy presigned URL upload avatar của user hiện tại' })
  @Post('me/avatar/upload-url')
  createAvatarUploadUrl(@CurrentUser() user: RequestUser, @Body() dto: AvatarUploadDto) {
    return this.users.createAvatarUploadUrl(user.userId, dto);
  }

  @ApiOperation({ summary: 'Xác nhận avatar object key của user hiện tại' })
  @Post('me/avatar/confirm')
  confirmAvatarUpload(@CurrentUser() user: RequestUser, @Body() dto: AvatarConfirmDto) {
    return this.users.confirmAvatarObjectKey(user.userId, dto.objectKey);
  }

  @ApiOperation({ summary: 'Lấy user theo id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @ApiOperation({ summary: 'Cập nhật user theo id' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @ApiOperation({ summary: 'Xóa user theo id' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
