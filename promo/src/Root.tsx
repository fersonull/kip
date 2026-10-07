import { Composition } from "remotion";
import { KipPromo } from "./KipPromo";
import { calculateTimeline } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="KipPromo"
      component={KipPromo}
      durationInFrames={1650}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{}}
      calculateMetadata={calculateTimeline}
    />
  );
};
