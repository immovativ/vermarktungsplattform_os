package de.immovativ.vermarktungsplattform.service

import arrow.core.Either
import com.typesafe.config.ConfigFactory
import io.ktor.http.ContentType
import io.ktor.server.config.HoconApplicationConfig
import mu.KotlinLogging
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.CopyObjectResponse
import software.amazon.awssdk.services.s3.model.GetObjectResponse
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.io.File
import java.net.URI

class S3Service() {
    companion object {
        val logger = KotlinLogging.logger {}
    }

    private val config = HoconApplicationConfig(ConfigFactory.load())
    private val accessKey = config.property("s3.accessKey").getString()
    private val secretKey = config.property("s3.secretKey").getString()
    private val s3Region = config.property("s3.region").getString()
    private val endpoint = config.property("s3.endpoint").getString()
    private val attachmentBucketName = config.property("s3.attachmentBucketName").getString()

    private val s3Client = S3Client.builder()
        .region(Region.of(s3Region))
        .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
        .endpointOverride(URI.create(endpoint))
        .build()

    private suspend fun bucketExists(bucketName: String) = try {
        s3Client.headBucket { it.bucket(bucketName) }
        true
    } catch (e: Exception) {
        false
    }

    suspend fun upload(s3key: String, contentType: ContentType, data: ByteArray) = Either.catch {
        if (!bucketExists(attachmentBucketName)) {
            s3Client.createBucket { it.bucket(attachmentBucketName) }
        }

        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(attachmentBucketName)
                .key(s3key)
                .contentType(contentType.toString())
                .build(),
            RequestBody.fromBytes(data)
        )
    }

    fun download(s3Key: String): ResponseInputStream<GetObjectResponse> = s3Client.getObject { it.bucket(attachmentBucketName).key(s3Key) }

    suspend fun download(s3Key: String, file: File) = Either.catch {
        val response = s3Client.getObject { it.bucket(attachmentBucketName).key(s3Key) }

        file.writeBytes(response.readAllBytes())

        response.response().contentType()
    }

    suspend fun copy(sourceKey: String, targetKey: String): CopyObjectResponse =
        s3Client.copyObject {
            it.sourceBucket(attachmentBucketName)
                .destinationBucket(attachmentBucketName)
                .sourceKey(sourceKey)
                .destinationKey(targetKey)
        }

    suspend fun tryDelete(s3Key: String) {
        s3Client.deleteObject { it.bucket(attachmentBucketName).key(s3Key) }
    }
}
