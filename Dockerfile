FROM node:22-alpine AS frontend-build

WORKDIR /workspace/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


FROM eclipse-temurin:21-jdk-jammy AS backend-build

WORKDIR /workspace/back
COPY back/ ./
RUN rm -rf src/main/resources/static \
    && mkdir -p src/main/resources/static
COPY --from=frontend-build /workspace/frontend/dist/ ./src/main/resources/static/
RUN chmod +x gradlew \
    && ./gradlew clean bootJar --no-daemon -x test


FROM eclipse-temurin:21-jre-jammy

WORKDIR /app
COPY --from=backend-build /workspace/back/build/libs/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
