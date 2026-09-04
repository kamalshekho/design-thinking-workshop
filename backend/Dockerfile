FROM docker.io/library/maven:3.9-eclipse-temurin-25-alpine AS build
WORKDIR /build

COPY pom.xml ./
RUN mvn -B dependency:go-offline

COPY src/ src/
RUN mvn -B -DskipTests package

FROM docker.io/library/eclipse-temurin:25-jre-alpine
WORKDIR /app

COPY --from=build /build/target/volunteer-form-service-*.jar app.jar

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
