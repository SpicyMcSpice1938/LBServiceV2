import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Plot from 'react-plotly.js';
import { fillMissingYears, polyRegression } from '../utils/regressionUtils';

export default function UserStatsPage() {
    const { username } = useParams();
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [error, setError] = useState(null);
    
    const [appliedDegree, setAppliedDegree] = useState(1);


    const [sliderDegree, setSliderDegree] = useState(1);
    
    //for line of best fit
    const [fittedValues, setFittedValues] = useState(null);
    const [residuals, setResiduals] = useState(null);
    const [filteredYearsDisplay, setFilteredYearsDisplay] = useState(null);
    const [filteredFreqDisplay, setFilteredFreqDisplay] = useState(null);

    // const [yearBounds, setYearBounds] = useState([0, new Date().getFullYear()])
    const [floor, setFloor] = useState(0)
    const [minYearBound, setMinYearBound] = useState(null);
    const [maxYearBound, setMaxYearBound] = useState(new Date().getFullYear());

    useEffect(() => {
        const base_API_URL  = import.meta.env.VITE_API_URL;
        setLoading(true)
        fetch(`${base_API_URL}/distribution/${username}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setError(null)
                setUserStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching user stats:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [username]);

    // Reset regression state when username changes
    useEffect(() => {
        setFittedValues(null);
        setResiduals(null);
        setFilteredYearsDisplay(null);
        setFilteredFreqDisplay(null);
        setAppliedDegree(1);
        setSliderDegree(1);
        setFloor(0);
        setMinYearBound(null);
        setMaxYearBound(new Date().getFullYear());
    }, [username]);

    

    if (loading) {
        return <>
            <div style={{ padding: '20px' }}>Loading...</div>
            <div style={{ padding: '20px' }}>Scraping operations may take a while based on how many movies the user has watched</div>
            </>;
    }

    if (error) {
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                Error loading stats: {error}
            </div>
        );
    }

    if (!userStats?.frequencyDistribution) {
        return (
            <div style={{ padding: '20px' }}>
                No frequency distribution data available for {username}
            </div>
        );
    }

    const sortedEntries = Object.entries(userStats.frequencyDistribution)
        .sort(([yearA], [yearB]) => Number(yearA) - Number(yearB));
    
    const years = sortedEntries.map(([year]) => year);
    const freq = sortedEntries.map(([, frequency]) => frequency);
    const yearsNumeric = years.map(y => Number(y));

    const availableMinYear = Math.min(...yearsNumeric);
    const availableMaxYear = Math.max(...yearsNumeric);    

    const handleCalculate = () => {
        
        const completeEntries = fillMissingYears(sortedEntries);

        // have to keep filter logic in here. part of component state
        const finalMin = minYearBound ?? availableMinYear;
        const finalMax = maxYearBound ?? availableMaxYear;

        const filteredData = completeEntries.filter(([year]) => {
            const y = Number(year);
            return y >= finalMin && y <= finalMax;
        });

        const filteredYears = filteredData.map(([year]) => Number(year));
        const filteredFreq = filteredData.map(([, frequency]) => frequency);
        const filteredYearsStr = filteredData.map(([year]) => year);

        if (filteredYears.length <= sliderDegree) {
            alert(`Not enough data points for degree ${sliderDegree}.`);
            return;
        }

        const yearOffset = Math.min(...filteredYears);
        const centeredYears = filteredYears.map(y => y - yearOffset);

        try {
            const coeffs = polyRegression(centeredYears, filteredFreq, sliderDegree);
            
            const fitted = centeredYears.map(x => {
                let value = coeffs.reduce((sum, coeff, i) => sum + coeff * Math.pow(x, i), 0);
                return Math.max(value, floor); 
            });

            const resid = filteredFreq.map((val, i) => val - fitted[i]);

            setFittedValues(fitted);
            setResiduals(resid);
            setFilteredYearsDisplay(filteredYearsStr);
            setFilteredFreqDisplay(filteredFreq);
            setAppliedDegree(sliderDegree);

        } catch (err) {
            console.error("Regression error:", err);
            alert("Calculation failed. The matrix might be singular (try a lower degree).");
        }
    };
    const mainPlotData = [
        {
            x: years,
            y: freq,
            type: 'bar',
            name: 'Frequency',
            marker: {
                color: 'rgb(55, 83, 109)'
            }
        }
    ];

    if (fittedValues) {
        mainPlotData.push({
            x: filteredYearsDisplay || years,
            y: fittedValues,
            type: 'scatter',
            mode: 'lines',
            name: `Polynomial Fit (degree ${appliedDegree})`,
            line: {
                color: 'rgb(255, 65, 54)',
                width: 3
            }
        });
    }

    const residualPlotData = residuals ? [
        {
            x: filteredYearsDisplay || years,
            y: residuals,
            type: 'scatter',
            mode: 'markers',
            name: 'Residuals',
            marker: {
                color: 'rgb(255, 65, 54)',
                size: 6
            }
        },
        {
            x: filteredYearsDisplay || years,
            y: Array((filteredYearsDisplay || years).length).fill(0),
            type: 'scatter',
            mode: 'lines',
            name: 'Zero Line',
            line: {
                color: 'black',
                width: 1,
                dash: 'dash'
            },
            showlegend: false
        }
    ] : [];

    return (
        <div
            className='user-stats-div'
        >
            <div className='regression-controls'>
                
                
                <div className='degreeControls' style={{ marginBottom: '20px' }}>
                    <h3>Polynomial Regression Controls</h3>
                    <label>
                    <span>Polynomial Degree:</span>
                    <span style={{
                        display: 'inline-block',
                        width: '36px',           // fixed width to avoid layout shift
                        textAlign: 'center',
                        fontFamily: 'monospace'
                    }}>
                        {sliderDegree}
                    </span>
                    </label>
                    <input 
                        type="range" 
                        min={0} 
                        max={10}
                        value={sliderDegree}
                        onChange={(e) => setSliderDegree(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div className='floor-controls' style={{ marginBottom: '20px' }}>
                    <label>
                        <span>Floor Value:</span>
                        <input 
                            type="number" 
                            value={floor}
                            onChange={(e) => setFloor(Number(e.target.value))}
                        />
                    </label>
                </div>

                <div className='year-bounds-controls' style={{ marginBottom: '20px' }}>
                    <label style={{ marginRight: '15px' }}>
                        <span>Min Year:</span>
                        <input 
                            type="number" 
                            value={minYearBound ?? availableMinYear}
                            onChange={(e) => setMinYearBound(e.target.value === '' ? null : Number(e.target.value))}
                            placeholder="All"
                        />
                    </label>
                    <label>
                        <span>Max Year:</span>
                        <input 
                            type="number" 
                            value={maxYearBound ?? availableMaxYear}
                            onChange={(e) => setMaxYearBound(e.target.value === '' ? null : Number(e.target.value))}
                            placeholder="All"
                            max={availableMaxYear ?? new Date().getFullYear}
                        />
                    </label>
                </div>

                <button 
                    onClick={handleCalculate}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
                >
                    Calculate
                </button>
            </div>

            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ width: '100%', margin: '0 auto 20px' }}>
                        <Plot
                            data={mainPlotData}
                            layout={{
                                title: {
                                    text: `Frequency Distribution of ${username}`,
                                    font: { size: 18, color: '#000' },
                                    x: 0.5
                                },
                                xaxis: { title: 'Year' },
                                yaxis: { title: 'Frequency' },
                                font: { color: '#000' },
                                paper_bgcolor: '#fff',
                                plot_bgcolor: '#fff',
                                margin: { t: 80 },
                                autosize: true,
                                showlegend: true
                            }}
                            style={{ width: '100%', margin: '0 auto' }}
                            useResizeHandler={true}
                        />
                    </div>
                     
                    {residuals && (
                        <div style={{ width: '100%', margin: '0 auto' }}>
                            <Plot
                                data={residualPlotData}
                                layout={{
                                    title: {
                                        text: 'Residuals Plot',
                                        font: { size: 16, color: '#000' },
                                        x: 0.5
                                    },
                                    xaxis: { title: 'Year' },
                                    yaxis: { title: 'Residuals', zeroline: true },
                                    font: { color: '#000' },
                                    paper_bgcolor: '#fff',
                                    plot_bgcolor: '#fff',
                                    margin: { t: 70 },
                                    autosize: true,
                                    showlegend: true
                                }}
                                style={{ width: '100%', margin: '0 auto' }}
                                useResizeHandler={true}
                            />
                        </div>
                    )}
                </div>
                {residuals && (
                    <div className='residuals-list'>
                        <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#000' }}>Years by Residual</h4>
                        <div>
                            {residuals.length > 0 && 
                                (filteredYearsDisplay || years)
                                    .map((year, i) => ({ year, residual: residuals[i] }))
                                    .filter((item) => item.residual < 0)
                                    .sort((a, b) => a.residual - b.residual)
                                    .map((item) => (
                                        <div className='residual-item' key={item.year}>
                                            <div style={{ fontWeight: 'bold' }}>{item.year}</div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                                {item.residual.toFixed(3)}
                                            </div>
                                        </div>
                                    ))
                            }
                        </div>
                    </div>
                )}
            </div>
         </div>
     );
 }