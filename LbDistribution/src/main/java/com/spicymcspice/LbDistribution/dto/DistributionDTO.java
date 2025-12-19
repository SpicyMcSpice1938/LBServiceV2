package com.spicymcspice.LbDistribution.dto;

import java.util.Map;

public class DistributionDTO {
    private String username;
    private Map<Integer, Integer> frequencyDistribuition;
    private int totalMovies;

    public DistributionDTO(String username, Map<Integer, Integer> frequencyDistribuition) {
        this.username = username;
        this.frequencyDistribuition = frequencyDistribuition;
        this.totalMovies = calculateTotalMovies();
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Map<Integer, Integer> getFrequencyDistribuition() {
        return frequencyDistribuition;
    }

    public void setFrequencyDistribuition(Map<Integer, Integer> frequencyDistribuition) {
        this.frequencyDistribuition = frequencyDistribuition;
    }

    public int getTotalMovies() {
        return totalMovies;
    }

    public void setTotalMovies(int totalMovies) {
        this.totalMovies = totalMovies;
    }

    private int calculateTotalMovies() {
        return frequencyDistribuition.values().stream()
                .mapToInt(Integer::intValue)
                .sum();
    }
}
