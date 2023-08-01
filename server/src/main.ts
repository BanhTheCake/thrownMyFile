import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configServices = app.get(ConfigService);
  app.enableCors({
    origin: '*',
  });
  await app.listen(configServices.get('PORT') || 3000);
}
bootstrap();
