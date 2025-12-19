package com.spicymcspice.LbDistribution.controller;

import com.spicymcspice.LbDistribution.dto.DistributionDTO;
import com.spicymcspice.LbDistribution.service.ScraperService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DistributionController {
    private final ScraperService scraperService;

    public DistributionController(ScraperService scraperService) {
        this.scraperService = scraperService;
    }

    @GetMapping("/distribution/{lbUsername}")
    public ResponseEntity<DistributionDTO> getDistribution(@PathVariable String lbUsername){
        //wire in service. call service to getDistribution.
        //under the hood, service will check cache. if not present in cache, generate distribution
        return ResponseEntity.ok(scraperService.getDistribution(lbUsername));
    }


}
