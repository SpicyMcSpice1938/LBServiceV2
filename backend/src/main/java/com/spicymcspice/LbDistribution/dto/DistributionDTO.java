package com.spicymcspice.LbDistribution.dto;

import java.util.Map;

public class DistributionDTO {
    private String username;
    private Map<Integer, Integer> frequencyDistribution;
    private int totalMovies;

    public DistributionDTO(String username, Map<Integer, Integer> frequencyDistribution) {
        this.username = username;
        this.frequencyDistribution = frequencyDistribution;
        this.totalMovies = calculateTotalMovies();
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Map<Integer, Integer> getFrequencyDistribution() {
        return frequencyDistribution;
    }

    public void setFrequencyDistribution(Map<Integer, Integer> frequencyDistribution) {
        this.frequencyDistribution = frequencyDistribution;
    }

    public int getTotalMovies() {
        return totalMovies;
    }

    public void setTotalMovies(int totalMovies) {
        this.totalMovies = totalMovies;
    }

    private int calculateTotalMovies() {
        return frequencyDistribution.values().stream()
                .mapToInt(Integer::intValue)
                .sum();
    }
}
