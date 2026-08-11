import { useLottie } from "lottie-react";
import NoDataAnimation from "../../assets/NoDataFound.json";
import "./NoDataFound.scss";

const NoDataFound = () => {
  const options = {
    animationData: NoDataAnimation,
    loop: true,
    autoplay: true,
  };

  const { View } = useLottie(options);

  return (
    <div className="no-data">
      <div className="no-data__animation">{View}</div>
    </div>
  );
};

export default NoDataFound;
