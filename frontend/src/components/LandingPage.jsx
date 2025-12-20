import { Route, Routes } from "react-router-dom";
import UserStatsPage from "./WatchedStatsPage";
import SearchBar from "./SearchBar"


export default function LandingPage(){
	return(
		<>
      <SearchBar/>
      <main>
        {/* dynamic content area. search bar will always be present */}
        <Routes>
          <Route path='/watched/:username' element={<UserStatsPage/>} />
        </Routes>
      </main>
		</>

	)
}