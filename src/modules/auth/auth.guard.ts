import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const origin = request.headers['origin'] || request.headers['referer'];

    if (!apiKey || !this.authService.validateApiKey(apiKey)) {
      throw new UnauthorizedException('Invalid API Key');
    }

    if (origin && !this.authService.validateOrigin(origin)) {
      throw new UnauthorizedException('Invalid origin');
    }

    return true;
  }
}