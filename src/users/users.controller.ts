import { Controller, Post, Body, Headers } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.usersService.signup(signupDto);
  }

  @Post('signin')
  signin(@Body() signinDto: SigninDto) {
    return this.usersService.signin(signinDto);
  }

  @Post('confirm')
  async confirm(@Body() body: { email: string; code: string }) {
    return this.usersService.confirmSignUp(body.email, body.code);
  }

  @Post('signout')
  async signout(@Headers('authorization') authHeader: string) {
    await this.usersService.signout(authHeader);
    return { message: 'Signed out successfully' };
  }
}
