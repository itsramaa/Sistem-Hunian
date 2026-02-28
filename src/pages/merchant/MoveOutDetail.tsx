import { useParams } from "react-router-dom";
import { MoveOutWizard } from "@/features/contracts/components/move-out-wizard/MoveOutWizard";

export default function MerchantMoveOutDetail() {
  const { noticeId } = useParams<{ noticeId: string }>();

  return <MoveOutWizard noticeId={noticeId || ""} />;
}
