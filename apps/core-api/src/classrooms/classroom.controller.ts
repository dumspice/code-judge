import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('classroom')
export class ClassroomController {
    constructor(private readonly service: ClassroomService) { }

    // CREATE
    @Post()
    create(@Body() dto: CreateClassroomDto, @CurrentUser() user) {
        return this.service.create(dto, user.userId);
    }

    // GET MY CLASSES
    @Get('me')
    getMyClasses(@CurrentUser() user) {
        return this.service.getMyClasses(user.userId);
    }

    // GET DETAIL
    @Get(':id')
    getDetail(@Param('id') id: string, @CurrentUser() user) {
        return this.service.getDetail(id, user.userId);
    }

    // UPDATE
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateClassroomDto,
        @CurrentUser() user,
    ) {
        return this.service.update(id, dto, user.userId);
    }

    // DELETE
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user) {
        return this.service.remove(id, user.userId);
    }

    // JOIN
    @Post('join')
    join(@Body() dto: JoinClassroomDto, @CurrentUser() user) {
        return this.service.join(dto, user.userId);
    }
}