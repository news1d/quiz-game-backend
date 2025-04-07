import { configModule } from './config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './features/user-accounts/api/users.controller';
import { TestingController } from './testing/api/testing.controller';
import { TestingService } from './testing/application/testing.service';
import { CryptoService } from './features/user-accounts/application/crypto.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './features/notifications/email.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './features/user-accounts/api/auth.controller';
import { AuthService } from './features/user-accounts/application/auth.service';
import { AuthQueryRepository } from './features/user-accounts/infrastructure/query/auth.query-repository';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './features/user-accounts/guards/local/local.strategy';
import { JwtStrategy } from './features/user-accounts/guards/bearer/jwt.strategy';
import { CoreConfig } from './core/core.config';
import { CoreModule } from './core/core.module';
import { EmailConfig } from './features/notifications/email.config';
import { EmailModule } from './features/notifications/email.module';
import { UserModule } from './features/user-accounts/user-accounts.module';
import { JwtConfig } from './features/user-accounts/config/jwt.config';
import { AllExceptionsFilter } from './core/exceptions/filters/all-exceptions-filter';
import { CreateUserUseCase } from './features/user-accounts/application/usecases/create-user.usecase';
import { DeleteUserUseCase } from './features/user-accounts/application/usecases/delete-user.usecase';
import { CqrsModule } from '@nestjs/cqrs';
import { RegisterUserUseCase } from './features/user-accounts/application/usecases/register-user.usecase';
import { LoginUserUseCase } from './features/user-accounts/application/usecases/login-user.usecase';
import { UpdatePasswordUseCase } from './features/user-accounts/application/usecases/update-password.usecase';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './features/user-accounts/constants/auth-tokens.inject-constants';
import { PasswordRecoveryUseCase } from './features/user-accounts/application/usecases/password-recovery.usecase';
import { RegistrationConfirmationUseCase } from './features/user-accounts/application/usecases/registration-confirmation.usecase';
import { RegistrationEmailResendingUseCase } from './features/user-accounts/application/usecases/registration-email-resending.usecase';
import { SecurityDevicesController } from './features/user-accounts/api/security-devices.controller';
import { RefreshTokenStrategy } from './features/user-accounts/guards/bearer/refresh-token.strategy';
import { TerminateAllOtherDevicesUseCase } from './features/user-accounts/application/usecases/terminate-all-other-devices.usecase';
import { TerminateDeviceUseCase } from './features/user-accounts/application/usecases/terminate-device.usecase';
import { RefreshTokenUseCase } from './features/user-accounts/application/usecases/refresh-token.usecase';
import { LogoutUserUseCase } from './features/user-accounts/application/usecases/logout-user.usecase';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './features/user-accounts/infrastructure/users.repository';
import { UsersQueryRepository } from './features/user-accounts/infrastructure/query/users.query-repository';
import { TestingRepository } from './testing/infrastructure/testing.repository';
import { SecurityDevicesQueryRepository } from './features/user-accounts/infrastructure/query/security-devices.query-repository';
import { SecurityDevicesRepository } from './features/user-accounts/infrastructure/security-devices.repository';
import { BlacklistRepository } from './features/user-accounts/infrastructure/blacklist.repository';
import { User } from './features/user-accounts/domain/user.entity';
import { Device } from './features/user-accounts/domain/device.entity';
import { Blacklist } from './features/user-accounts/domain/blacklist.entity';
import { UserMeta } from './features/user-accounts/domain/user-meta.entity';
import { CreateQuestionUseCase } from './features/quiz-game/questions/application/usecases/create-question.usecase';
import { UpdateQuestionUseCase } from './features/quiz-game/questions/application/usecases/update-question.usecase';
import { DeleteQuestionUseCase } from './features/quiz-game/questions/application/usecases/delete-question.usecase';
import { UpdatePublishStatusUseCase } from './features/quiz-game/questions/application/usecases/update-publish-status.usecase';
import { Game } from './features/quiz-game/games/domain/game.entity';
import { GameQuestion } from './features/quiz-game/games/domain/game-questions.entity';
import { Question } from './features/quiz-game/questions/domain/question.entity';
import { Answer } from './features/quiz-game/answers/domain/answer.entity';
import { Player } from './features/quiz-game/players/domain/player.entity';
import { QuizSAController } from './features/quiz-game/questions/api/quiz.sa.controller';
import { QuestionsRepository } from './features/quiz-game/questions/infrastructure/questions.repository';
import { QuestionsQueryRepository } from './features/quiz-game/questions/infrastructure/query/questions.query-repository';
import { ConnectUserToPairUseCase } from './features/quiz-game/games/application/usecases/connect-user-to-pair.usecase';
import { PlayersRepository } from './features/quiz-game/players/infrastructure/players.repository';
import { GameQuestionsRepository } from './features/quiz-game/games/infrastructure/game-questions.repository';
import { GamesRepository } from './features/quiz-game/games/infrastructure/games.repository';
import { GamesQueryRepository } from './features/quiz-game/games/infrastructure/query/games.query-repository';
import { GamesController } from './features/quiz-game/games/api/games.controller';
import { SendAnswerUseCase } from './features/quiz-game/games/application/usecases/send-answer.usecase';
import { AnswersRepository } from './features/quiz-game/answers/infrastructure/answers.repository';
import { AnswersQueryRepository } from './features/quiz-game/answers/infrastructure/query/answers.query-repository';
import { CreateAnswerUseCase } from './features/quiz-game/answers/application/usecases/create-answer.usecase';
import { CreatePlayerUseCase } from './features/quiz-game/players/application/usecases/create-player.usecase';
import { CreateGameUseCase } from './features/quiz-game/games/application/usecases/create-game.usecase';
import { CreateGameQuestionsUseCase } from './features/quiz-game/games/application/usecases/create-game-questions.usecase';
import { StartGameUseCase } from './features/quiz-game/games/application/usecases/start-game.usecase';
import { FinishGameUseCase } from './features/quiz-game/games/application/usecases/finish-game.usecase';
import { PlayersQueryRepository } from './features/quiz-game/players/infrastructure/query/players.query-repository';

const userUseCases = [
  CreateUserUseCase,
  DeleteUserUseCase,
  RegisterUserUseCase,
  LoginUserUseCase,
  UpdatePasswordUseCase,
  PasswordRecoveryUseCase,
  RegistrationConfirmationUseCase,
  RegistrationEmailResendingUseCase,
  LogoutUserUseCase,
  RefreshTokenUseCase,
];

const securityDevicesUseCases = [
  TerminateAllOtherDevicesUseCase,
  TerminateDeviceUseCase,
];

const questionUseCases = [
  CreateQuestionUseCase,
  DeleteQuestionUseCase,
  UpdateQuestionUseCase,
  UpdatePublishStatusUseCase,
];

const pairUseCases = [ConnectUserToPairUseCase, SendAnswerUseCase];

const playerUseCases = [CreatePlayerUseCase];

const answerUseCases = [CreateAnswerUseCase];

const gameUseCases = [
  CreateGameUseCase,
  CreateGameQuestionsUseCase,
  StartGameUseCase,
  FinishGameUseCase,
];

@Module({
  imports: [
    configModule,
    CoreModule,
    EmailModule,
    UserModule,
    CqrsModule,
    JwtModule,
    TypeOrmModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        return {
          type: 'postgres',
          host: coreConfig.dbHost,
          port: coreConfig.dbPort,
          username: coreConfig.dbUser,
          password: coreConfig.dbPassword,
          database: coreConfig.dbName,
          ssl: true,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
      inject: [CoreConfig],
    }),
    TypeOrmModule.forFeature([
      User,
      UserMeta,
      Device,
      Blacklist,
      Game,
      GameQuestion,
      Question,
      Answer,
      Player,
    ]),
    MailerModule.forRootAsync({
      useFactory: (emailConfig: EmailConfig) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: emailConfig.emailAddress,
            pass: emailConfig.emailPassword,
          },
        },
        defaults: {
          from: `SonicBitService <${emailConfig.emailAddress}>`,
        },
      }),
      inject: [EmailConfig],
    }),
    ThrottlerModule.forRoot([
      // {
      //   ttl: seconds(10),
      //   limit: 5,
      // },
    ]),
    PassportModule,
  ],
  controllers: [
    AppController,
    UsersController,
    TestingController,
    AuthController,
    SecurityDevicesController,
    QuizSAController,
    GamesController,
  ],
  providers: [
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (jwtConfig: JwtConfig) => {
        return new JwtService({
          secret: jwtConfig.jwtSecret,
          signOptions: { expiresIn: '5m' },
        });
      },
      inject: [JwtConfig],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (jwtConfig: JwtConfig) => {
        return new JwtService({
          secret: jwtConfig.refreshSecret,
          signOptions: { expiresIn: '10m' },
        });
      },
      inject: [JwtConfig],
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
    UsersRepository,
    UsersQueryRepository,
    TestingRepository,
    TestingService,
    CryptoService,
    EmailService,
    AuthService,
    AuthQueryRepository,
    LocalStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    AllExceptionsFilter,
    SecurityDevicesQueryRepository,
    SecurityDevicesRepository,
    BlacklistRepository,
    QuestionsRepository,
    QuestionsQueryRepository,
    PlayersRepository,
    PlayersQueryRepository,
    QuestionsRepository,
    GameQuestionsRepository,
    GamesRepository,
    GamesQueryRepository,
    AnswersRepository,
    AnswersQueryRepository,
    ...userUseCases,
    ...securityDevicesUseCases,
    ...questionUseCases,
    ...pairUseCases,
    ...playerUseCases,
    ...answerUseCases,
    ...gameUseCases,
  ],
})
export class AppModule {}
