package com.spicymcspice.LbDistribution.repository;

import com.spicymcspice.LbDistribution.dto.DistributionDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;

@Repository
public class LbDistributionRepository {
    private static final String KEY_PREFIX = "letterboxd:watched:distribution:";

    private final RedisTemplate<String, DistributionDTO> redisTemplate;


    public LbDistributionRepository(RedisTemplate<String, DistributionDTO> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void saveDistribution(String lbUsername, DistributionDTO distributionDTO, Duration duration){
        redisTemplate.opsForValue().set(buildKey(lbUsername), distributionDTO, duration);
    }

    public boolean exists(String lbUsername){
        String key = buildKey(lbUsername);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public DistributionDTO getDistribution(String username) {
        String key = buildKey(username);
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? (DistributionDTO) value : null;
    }
    private String buildKey(String username) {
        //someone could overpopulate the cache with random capitalizations lmao
        return KEY_PREFIX + username.toLowerCase();
    }
}
