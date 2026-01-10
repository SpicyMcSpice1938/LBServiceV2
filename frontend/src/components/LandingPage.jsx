import { Route, Routes } from "react-router-dom";
import WatchedStatsPage from "./WatchedStatsPage";
import SearchBar from "./SearchBar"


export default function LandingPage(){
	return(
		<>
      <SearchBar/>
      <main>
        {/* dynamic content area. search bar will always be present */}
        <Routes>
          <Route path='/watched/:username' element={<WatchedStatsPage/>} />
        </Routes>
      </main>
		</>

	)
}