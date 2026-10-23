import { Printer, X } from "lucide-react";
import type { ChangeRequest, Project } from "../types";
import { formatDate, formatMoney, quoteFor } from "../lib/logic";

interface Props {
  request: ChangeRequest;
  project: Project;
  onClose: () => void;
}

/**
 * A printable change-order document — the one-page paper trail that turns
 * "you never told me it cost extra" into a signed fact.
 */
export default function ChangeOrderModal({ request, project, onClose }: Props) {
  const quote = quoteFor(request, project);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Change order">
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-head no-print">
          <h3>Change order</h3>
          <button className="modal-x" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="print-area">
            <div className="doc">
              <h4>Change Order</h4>
              <p className="doc-sub">
                {project.name} · Issued {formatDate(request.createdAt)} · Request logged {formatDate(request.createdAt)}
              </p>
              <table>
                <tbody>
                  <tr>
                    <td className="k">Client</td>
                    <td>{project.client}</td>
                  </tr>
                  <tr>
                    <td className="k">Requested change</td>
                    <td>
                      <strong>{request.title}</strong>
                      {request.detail && <><br />{request.detail}</>}
                    </td>
                  </tr>
                  <tr>
                    <td className="k">Classification</td>
                    <td>Outside the original agreed scope — billed as an extra</td>
                  </tr>
                  <tr>
                    <td className="k">Estimated effort</td>
                    <td>{request.hours} hours at {formatMoney(project.hourlyRate, project.currency)}/hour</td>
                  </tr>
                  <tr>
                    <td className="k">Additional cost</td>
                    <td><strong>{formatMoney(quote, project.currency)}</strong></td>
                  </tr>
                  <tr>
                    <td className="k">Timeline impact</td>
                    <td>
                      {request.days > 0
                        ? `Delivery date moves by ${request.days} day${request.days === 1 ? "" : "s"}`
                        : "No change to the delivery date"}
                    </td>
                  </tr>
                  <tr>
                    <td className="k">Original project value</td>
                    <td>{formatMoney(project.value, project.currency)}</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: 13.5 }}>
                Work on this change begins only after written approval. Replying
                “approved” to the message or email carrying this document counts
                as approval. All other terms of the original agreement remain unchanged.
              </p>
              <div className="sig">
                Approved by client (name / date): ______________________________________
              </div>
            </div>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={15} /> Print / save as PDF
            </button>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
