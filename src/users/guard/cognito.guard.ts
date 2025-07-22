import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { Request } from 'express';
import * as dotenv from 'dotenv';


dotenv.config();

const REGION = process.env.COGNITO_REGION;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

const client = jwksClient({
  jwksUri: `${COGNITO_ISSUER}/.well-known/jwks.json`,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key?.getPublicKey();
    callback(err, signingKey);
  });
}

@Injectable()
export class CognitoGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          issuer: COGNITO_ISSUER,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) {
            return reject(new UnauthorizedException('Invalid token'));
          }

          (request as any).user = decoded;
          resolve(true);
        },
      );
    });
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
