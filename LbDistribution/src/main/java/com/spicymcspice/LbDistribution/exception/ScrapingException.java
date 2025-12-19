package com.spicymcspice.LbDistribution.exception;

import java.io.IOException;

public class ScrapingException extends RuntimeException {
    public ScrapingException() {
    }

    public ScrapingException(String message) {
        super(message);
    }

    public ScrapingException(String message, Throwable cause) {
        super(message, cause);
    }
}
