import { Injectable } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async signin(body: AuthDto) {
    //find the user by email
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });
    //if user does not exist throw exception
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }
    //compare passwords
    const isSamePassword = await argon.verify(user.hash, body.password);
    //if passwords incorrect throw exception
    if (!isSamePassword) {
      throw new ForbiddenException('Credentials incorrect');
    }

    return this.signToken(user.id, user.email);
  }

  async signup(body: AuthDto) {
    //generate the password hash
    const hash = await argon.hash(body.password);
    //save the new user in the db
    try {
      const user = await this.prisma.user.create({
        data: {
          email: body.email,
          hash,
          firstName: body.firstName,
          lastName: body.lastName,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          firstName: true,
          lastName: true,
        },
      });
      //return the saved user
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Credentials Taken');
      } else {
        throw error;
      }
    }
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email: email,
    };

    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });

    return { access_token: token };
  }
}
