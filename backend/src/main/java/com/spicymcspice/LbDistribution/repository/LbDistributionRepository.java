package com.spicymcspice.LbDistribution.repository;

import com.spicymcspice.LbDistribution.cache.CacheRepository;
import com.spicymcspice.LbDistribution.dto.DistributionDTO;
import org.springframework.stereotype.Repository;

import java.time.Duration;

@Repository
public class LbDistributionRepository {
    private final CacheRepository cacheRepository;

    public LbDistributionRepository(CacheRepository cacheRepository) {
        this.cacheRepository = cacheRepository;
    }

    public void saveDistribution(String lbUsername, DistributionDTO distributionDTO, Duration duration) {
        cacheRepository.saveDistribution(lbUsername, distributionDTO, duration);
    }

    public boolean exists(String lbUsername) {
        return cacheRepository.exists(lbUsername);
    }

    public DistributionDTO getDistribution(String username) {
        return cacheRepository.getDistribution(username);
    }
}
