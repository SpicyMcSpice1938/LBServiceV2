package com.spicymcspice.LbDistribution.cache;

import com.spicymcspice.LbDistribution.dto.DistributionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;

@Repository
@ConditionalOnProperty(name = "app.cache.type", havingValue = "redis")
public class RedisCacheRepository implements CacheRepository {
    private static final String KEY_PREFIX = "letterboxd:watched:distribution:";
    private static final Logger log = LoggerFactory.getLogger(RedisCacheRepository.class);

    private final RedisTemplate<String, DistributionDTO> redisTemplate;

    @Autowired
    public RedisCacheRepository(RedisTemplate<String, DistributionDTO> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void saveDistribution(String lbUsername, DistributionDTO distributionDTO, Duration duration) {
        String key = buildKey(lbUsername);
        redisTemplate.opsForValue().set(key, distributionDTO, duration);
        log.info("[Redis Cache] Cached distribution for user: {} with {} movies", lbUsername,
                distributionDTO != null ? distributionDTO.getTotalMovies() : 0);
    }

    @Override
    public boolean exists(String lbUsername) {
        String key = buildKey(lbUsername);
        boolean exists = Boolean.TRUE.equals(redisTemplate.hasKey(key));
        if (exists) {
            log.debug("[Redis Cache] Cache hit for user: {}", lbUsername);
        } else {
            log.debug("[Redis Cache] Cache miss for user: {}", lbUsername);
        }
        return exists;
    }

    @Override
    public DistributionDTO getDistribution(String username) {
        String key = buildKey(username);
        Object value = redisTemplate.opsForValue().get(key);
        DistributionDTO result = value != null ? (DistributionDTO) value : null;

        if (result != null) {
            log.debug("[Redis Cache] Retrieved cached distribution for user: {} with {} movies",
                    username, result.getTotalMovies());
        } else {
            log.debug("[Redis Cache] No cached distribution found for user: {}", username);
        }
        return result;
    }

    private String buildKey(String username) {
        return KEY_PREFIX + username.toLowerCase();
    }
}