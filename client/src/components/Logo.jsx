import logoImage from "@/assets/images/login_page_logo.png";

const Logo = ({ width, height }) => {
  const style = {
    width: width || "100px",
    height: height || "100px",
    backgroundImage: `url(${logoImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return <div style={style} />;
};

export default Logo;
