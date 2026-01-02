import { PrintLabelTemplate } from './PrintLabelPerusahaan'
import { requestLabelGovernment } from '../services/printLabel'


const PrintLabelGovernment = () => (
  <PrintLabelTemplate title="Cetak Label Government" onSubmit={requestLabelGovernment} />
)

export default PrintLabelGovernment
