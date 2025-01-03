import { useUser } from "./UserContext";
import AboutButton from "./AboutButton";
import LogoutButton from "./LogoutButton";

function Header() {
  const { user } = useUser();

  const style = {
    display: "flex",
    gap: "10px",
  };

  return (
    <header>
      <div className="logo">
        <h1>Property Market</h1>
      </div>
      <nav>
        <ul className="link">
          {/* <li><a href="">About</a></li> */}
          <li>
            <AboutButton />
          </li>
          {user && (
            <li>
              <LogoutButton />
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
