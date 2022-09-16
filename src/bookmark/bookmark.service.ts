import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async getBookmarks(userId: number) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
    });

    return bookmarks;
  }

  async getBookmarksById(userId: number, bookmarkId: number) {
    const bookmarks = await this.prisma.bookmark.findFirst({
      where: { id: bookmarkId, userId },
    });

    return bookmarks;
  }

  async createBookmark(userId: number, body: CreateBookmarkDto) {
    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId,
        ...body,
      },
    });
    return bookmark;
  }

  async editBookmarksById(
    userId: number,
    bookmarkId: number,
    body: EditBookmarkDto,
  ) {
    //get thhe bookmark by id
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id: bookmarkId, userId },
    });

    if (!bookmark || bookmark.userId !== userId)
      throw new ForbiddenException('Access to resource denied');

    return this.prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { ...body },
    });
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id: bookmarkId, userId },
    });

    if (!bookmark || bookmark.userId !== userId)
      throw new ForbiddenException('Access to resource denied');

    await this.prisma.bookmark.delete({
      where: { id: bookmarkId },
    });
  }
}
