package com.spicymcspice.LbDistribution.cache;

import com.spicymcspice.LbDistribution.dto.DistributionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Repository;

import java.time.Duration;

@Repository
@ConditionalOnProperty(name = "app.cache.type", havingValue = "caffeine", matchIfMissing = true)
public class CaffeineCacheRepository implements CacheRepository {
    private static final String CACHE_NAME = "WatchedDistributionDTOs";
    private static final Logger log = LoggerFactory.getLogger(CaffeineCacheRepository.class);
    private final CacheManager cacheManager;

    public CaffeineCacheRepository(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public void saveDistribution(String lbUsername, DistributionDTO distributionDTO, Duration duration) {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache != null) {
            cache.put(lbUsername.toLowerCase(), distributionDTO);
            log.info("[Caffeine Cache] Cached distribution for user: {} with {} movies", lbUsername,
                    distributionDTO != null ? distributionDTO.getTotalMovies() : 0);
        } else {
            log.warn("[Caffeine Cache] Cache not available when trying to save distribution for user: {}", lbUsername);
        }
    }

    @Override
    public boolean exists(String lbUsername) {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache != null) {
            boolean exists = cache.get(lbUsername.toLowerCase()) != null;
            if (exists) {
                log.debug("[Caffeine Cache] Cache hit for user: {}", lbUsername);
            } else {
                log.debug("[Caffeine Cache] Cache miss for user: {}", lbUsername);
            }
            return exists;
        }
        log.warn("[Caffeine Cache] Cache not available when checking existence for user: {}", lbUsername);
        return false;
    }

    @Override
    public DistributionDTO getDistribution(String username) {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache != null) {
            DistributionDTO result = cache.get(username.toLowerCase(), DistributionDTO.class);
            if (result != null) {
                log.debug("[Caffeine Cache] Retrieved cached distribution for user: {} with {} movies",
                        username, result.getTotalMovies());
            } else {
                log.debug("[Caffeine Cache] No cached distribution found for user: {}", username);
            }
            return result;
        } else {
            log.warn("[Caffeine Cache] Cache not available when trying to get distribution for user: {}", username);
            return null;
        }
    }
}