import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @MinLength(3)
  password: string;

}
