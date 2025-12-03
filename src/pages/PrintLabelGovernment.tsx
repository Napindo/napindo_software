import { PrintLabelTemplate } from './PrintLabelPerusahaan'
import { requestLabelGovernment } from '../services/printLabel'

// TODO: integrate additional report/label endpoints here when backend is ready.

const PrintLabelGovernment = () => (
  <PrintLabelTemplate title="Cetak Label Government" onSubmit={requestLabelGovernment} />
)

export default PrintLabelGovernment
