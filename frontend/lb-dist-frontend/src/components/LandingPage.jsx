import { Route, Routes } from "react-router-dom";
import UserStatsPage from "./UserStatsPage";
import SearchBar from "./SearchBar"


export default function LandingPage(){
	return(
		<>
      <SearchBar/>
      <main>
        {/* dynamic content area. search bar will always be present */}
        <Routes>
          <Route path='/userstats/:username' element={<UserStatsPage/>} />
        </Routes>
      </main>
		</>

	)
}