package com.spicymcspice.LbDistribution.config;

import com.spicymcspice.LbDistribution.dto.DistributionDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.jedis.JedisClientConfiguration;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Value("${spring.data.redis.password}")
    private String redisPassword;

    @Bean
    public JedisConnectionFactory jedisConnectionFactory() {
        RedisStandaloneConfiguration redisConfig = new RedisStandaloneConfiguration();
        redisConfig.setHostName(redisHost);
        redisConfig.setPort(redisPort);
        redisConfig.setPassword(redisPassword);

        JedisClientConfiguration.JedisClientConfigurationBuilder jedisClientConfig =
                JedisClientConfiguration.builder();
        jedisClientConfig.connectTimeout(Duration.ofSeconds(60));
        jedisClientConfig.usePooling();

        return new JedisConnectionFactory(redisConfig, jedisClientConfig.build());
    }

    @Bean
    public RedisTemplate<String, DistributionDTO> redisTemplate(JedisConnectionFactory connectionFactory) {
        RedisTemplate<String, DistributionDTO> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Serializer for Keys (String)
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Serializer for Values (JSON)
        JacksonJsonRedisSerializer<DistributionDTO> serializer =
                new JacksonJsonRedisSerializer<>(DistributionDTO.class);

        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);

        template.afterPropertiesSet();
        return template;
    }
}