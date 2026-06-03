import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // Custom error throwing for unauthorized requests
    if (err || !user) {
      throw err || new UnauthorizedException('You must be logged in to access this resource');
    }
    return user;
  }
}
