import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { UsersTestManager } from './users-test-manager';
import { deleteAllData } from './delete-all-data';
import { EmailService } from '../../src/features/notifications/email.service';
import { EmailServiceMock } from '../mock/email-service.mock';
import { appSetup } from '../../src/setup/app.setup';
import { AppModule } from '../../src/app.module';
import { AuthConfig } from '../../src/features/user-accounts/config/auth.config';
import cookieParser from 'cookie-parser';
import { DevicesTestManager } from './devices-test-manager';
import { QuestionsTestManager } from './questions-test-manager';
import { GamesTestManager } from './games-test-manager';

export const initSettings = async (
  //передаем callback, который получает ModuleBuilder, если хотим изменить настройку тестового модуля
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailService)
    .useClass(EmailServiceMock);

  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }

  const testingAppModule = await testingModuleBuilder.compile();

  const app = testingAppModule.createNestApplication();

  app.use(cookieParser());

  appSetup(app);

  await app.init();

  const httpServer = app.getHttpServer();
  const authConfig = app.get(AuthConfig);
  const usersTestManager = new UsersTestManager(app, authConfig);
  const devicesTestManager = new DevicesTestManager(app, usersTestManager);
  const questionsTestManager = new QuestionsTestManager(app, authConfig);
  const gamesTestManager = new GamesTestManager(app);

  await deleteAllData(app);

  return {
    app,
    httpServer,
    usersTestManager,
    devicesTestManager,
    questionsTestManager,
    gamesTestManager,
  };
};
