package com.spicymcspice.LbDistribution.service;

import com.spicymcspice.LbDistribution.dto.DistributionDTO;
import com.spicymcspice.LbDistribution.exception.ScrapingException;
import com.spicymcspice.LbDistribution.exception.UserNotFoundException;
import com.spicymcspice.LbDistribution.repository.LbDistributionRepository;
import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.time.Duration;
import java.util.TreeMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ScraperService {
    private static final Logger log = LoggerFactory.getLogger(ScraperService.class);

    private final LbDistributionRepository lbDistributionRepository;

    private static final String LETTERBOXD_BASE_URL = "https://letterboxd.com/%s/films/by/release-earliest/page/%d/";
    private static final Pattern YEAR_PATTERN = Pattern.compile("\\((\\d{4})\\)");
    private static final int CONNECTION_TIMEOUT_MS = 10000;
    private static final Duration CACHE_TTL = Duration.ofDays(3);

    public ScraperService(LbDistributionRepository lbDistributionRepository) {
        this.lbDistributionRepository = lbDistributionRepository;
    }

    public DistributionDTO getDistribution(String lbUsername) {
        log.info("Fetching distribution for user: {}", lbUsername);

        DistributionDTO cached = lbDistributionRepository.getDistribution(lbUsername);
        if (cached != null) {
            log.info("Cache hit for user: {}", lbUsername);
            return cached;
        }

        log.info("Cache miss for user: {}.", lbUsername);
        return scrapeProfile(lbUsername);
    }

    public DistributionDTO scrapeProfile(String lbUsername) {
        Map<Integer, Integer> yearDistribution = new TreeMap<>();  // Sorted by year

        try {
            String firstPageUrl = String.format(LETTERBOXD_BASE_URL, lbUsername, 1);
            Document firstPage = connectToPage(firstPageUrl);
            int numPages = getNumPages(firstPage);

            log.debug("Found {} pages for user: {}", numPages, lbUsername);

            for (int i = 1; i <= numPages; i++) {
                String pageUrl = String.format(LETTERBOXD_BASE_URL, lbUsername, i);
                Document page = connectToPage(pageUrl);

                Elements frameTitles = page.getElementsByAttribute("data-item-name");
                for (Element elem : frameTitles) {
                    String frameTitleText = elem.attr("data-item-name");
                    Integer year = extractYear(frameTitleText);

                    if (year != null) {
                        yearDistribution.merge(year, 1, Integer::sum);
                    }
                }
                if (i < numPages) {
                    Thread.sleep(500);
                }
            }

            if (yearDistribution.isEmpty()) {
                log.warn("No movies found for user: {}", lbUsername);
                throw new ScrapingException("No movies found for user: " + lbUsername);
            }

            log.info("Successfully scraped {} movies for user: {}",
                    yearDistribution.values().stream().mapToInt(Integer::intValue).sum(),
                    lbUsername);

            // Save to cache and return
            DistributionDTO dto = new DistributionDTO(lbUsername, yearDistribution);
            lbDistributionRepository.saveDistribution(lbUsername, dto, CACHE_TTL);
            return dto;

        } catch (HttpStatusException e) {
            if (e.getStatusCode() == 404) {
                log.warn("User not found: {}", lbUsername);
                throw new UserNotFoundException(lbUsername);
            }
            log.error("HTTP error while scraping user {}: Status {}", lbUsername, e.getStatusCode(), e);
            throw new ScrapingException("HTTP error while scraping: " + e.getMessage(), e);

        } catch (SocketTimeoutException e) {
            log.error("Timeout while scraping user: {}", lbUsername, e);
            throw new ScrapingException("Connection timeout while accessing Letterboxd", e);

        } catch (IOException e) {
            log.error("Network error while scraping user: {}", lbUsername, e);
            throw new ScrapingException("Network error while scraping: " + e.getMessage(), e);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Scraping interrupted for user: {}", lbUsername, e);
            throw new ScrapingException("Scraping was interrupted", e);
        }
    }

    private Document connectToPage(String url) throws IOException {
        return Jsoup.connect(url)
                .userAgent("Mozilla/5.0")
                .timeout(CONNECTION_TIMEOUT_MS)
                .get();
    }

    private int getNumPages(Document doc) {
        Elements paginatePages = doc.getElementsByClass("paginate-page");

        if (paginatePages.isEmpty()) {
            return 1;
        }

        Element lastPage = paginatePages.last();
        if (lastPage == null) {
            return 1;
        }

        try {
            return Integer.parseInt(lastPage.text());
        } catch (NumberFormatException e) {
            log.warn("Could not parse page number: {}", lastPage.text());
            return 1;
        }
    }

    private Integer extractYear(String movieData) {
        if (movieData == null || movieData.isEmpty()) {
            return null;
        }

        Matcher matcher = YEAR_PATTERN.matcher(movieData);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }

        return null;
    }
}