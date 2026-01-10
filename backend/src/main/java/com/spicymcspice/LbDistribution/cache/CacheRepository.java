package com.spicymcspice.LbDistribution.cache;

import com.spicymcspice.LbDistribution.dto.DistributionDTO;
import java.time.Duration;

public interface CacheRepository {
    void saveDistribution(String lbUsername, DistributionDTO distributionDTO, Duration duration);
    boolean exists(String lbUsername);
    DistributionDTO getDistribution(String username);
}