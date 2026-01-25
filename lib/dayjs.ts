import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// 기본 타임존을 한국으로 설정
dayjs.tz.setDefault("Asia/Seoul");

export default dayjs;
