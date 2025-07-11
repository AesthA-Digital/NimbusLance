import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], //If your frontend is on a different port (e.g., 3001), you should enable CORS
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true })); // strips properties that do not have decorator
  app.enableShutdownHooks(); // enable shutdown hooks for production
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
