import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function UserStatsPage() {
    const username = useParams().username;

    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    useEffect(() => {
    const url = import.meta.env.VITE_API_URL;
    
    console.log(`${url}/api/distribution/${username}`)
    console.log("Username is:", username)
    fetch(`${url}/api/distribution/${username}`)
        .then(res => res.json())
        .then(data => {
            setUserStats(data);
            setLoading(false);
        })
        .catch(err => console.error(err));
    }, [username]);
    

    if(loading) return <div>loading....</div> 
    return (
        <div>
            
            
        </div>
    );
}
