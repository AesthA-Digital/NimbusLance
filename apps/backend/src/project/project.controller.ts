import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserPayload } from '../auth/types/auth.types';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @GetUser() user: UserPayload) {
    return this.projectService.create(user.sub, dto);
  }

  @Get()
  findAll(@GetUser() user: UserPayload) {
    return this.projectService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.projectService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @GetUser() user: UserPayload,
  ) {
    return this.projectService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.projectService.remove(user.sub, id);
  }
}
