FROM eclipse-temurin:17-jre

WORKDIR /app

COPY build/libs/application-all.jar /app/application-all.jar
COPY dist /app/dist

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/application-all.jar"]
