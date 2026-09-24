import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RiRefreshLine } from '@remixicon/react';

import {
  adminService,
  itemsOfList,
} from '../../services/admin';

import { useToast } from '../../context/ToastContext';

import '../../styles/admin-telemetry.css';

const METHODS = [
  'POST',
  'PATCH',
  'PUT',
  'DELETE',
];

const text = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  return String(value);
};

const statusCodeOf = (row) => {
  const code = Number(
    row?.status_code,
  );

  return Number.isFinite(code)
    ? code
    : 0;
};

const isSuccessStatus = (code) =>
  code >= 200 && code < 400;

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      dateStyle: 'medium',
      timeStyle: 'medium',
    },
  ).format(date);
};

const compactId = (value) => {
  const normalized = text(value);

  if (
    normalized === '—' ||
    normalized.length <= 12
  ) {
    return normalized;
  }

  return `${normalized.slice(0, 12)}…`;
};

const durationText = (value) => {
  const duration = Number(value);

  if (!Number.isFinite(duration)) {
    return '—';
  }

  return `${Math.max(0, duration)} ms`;
};

export default function AuditLogsPanel() {
  const { toast } =
    useToast();

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    method,
    setMethod,
  ] = useState('all');

  const [
    status,
    setStatus,
  ] = useState('all');

  const mountedRef =
    useRef(true);

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const load =
    useCallback(async () => {
      const requestId =
        ++requestIdRef.current;

      setLoading(true);

      try {
        const response =
          await adminService.auditLogs(
            200,
          );

        const nextRows =
          itemsOfList(response);

        if (
          !mountedRef.current ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        setRows(
          Array.isArray(nextRows)
            ? nextRows
            : [],
        );
      } catch (error) {
        if (
          !mountedRef.current ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        toast.error(
          error?.message ||
            'Unable to load audit logs.',
        );
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats =
    useMemo(() => {
      let successful = 0;
      let errors = 0;

      for (const row of rows) {
        const code =
          statusCodeOf(row);

        if (
          isSuccessStatus(code)
        ) {
          successful += 1;
        } else if (
          code >= 400
        ) {
          errors += 1;
        }
      }

      return {
        total: rows.length,
        successful,
        errors,
      };
    }, [rows]);

  const filtered =
    useMemo(() => {
      return rows.filter(
        (row) => {
          const rowMethod =
            text(row?.method)
              .toUpperCase();

          const code =
            statusCodeOf(row);

          const methodMatch =
            method === 'all' ||
            rowMethod === method;

          const statusMatch =
            status === 'all' ||
            (
              status === 'success' &&
              isSuccessStatus(code)
            ) ||
            (
              status === 'error' &&
              code >= 400
            );

          return (
            methodMatch &&
            statusMatch
          );
        },
      );
    }, [
      rows,
      method,
      status,
    ]);

  return (
    <section
      className="admin-panel"
      aria-labelledby="audit-logs-title"
    >
      <div className="admin-card admin-telemetry-card">
        <div className="admin-toolbar ops-toolbar">
          <div>
            <h2 id="audit-logs-title">
              Audit Logs
            </h2>

            <p>
              Server-generated mutation
              telemetry for security and
              operational review.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={load}
            disabled={loading}
            aria-busy={loading}
          >
            <RiRefreshLine
              size={16}
              aria-hidden="true"
            />

            <span>
              {loading
                ? 'Loading…'
                : 'Refresh'}
            </span>
          </button>
        </div>

        <div
          className="admin-stats"
          aria-label="Audit log summary"
        >
          <div className="admin-stat">
            <div className="stat-label">
              Entries
            </div>

            <div
              className="stat-value"
              aria-live="polite"
            >
              {loading
                ? '…'
                : stats.total}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">
              Successful
            </div>

            <div className="stat-value">
              {loading
                ? '…'
                : stats.successful}
            </div>
          </div>

          <div className="admin-stat">
            <div className="stat-label">
              Errors
            </div>

            <div className="stat-value">
              {loading
                ? '…'
                : stats.errors}
            </div>
          </div>
        </div>

        <div
          className="admin-telemetry-filters"
          aria-label="Audit log filters"
        >
          <label className="sr-only" htmlFor="audit-method">
            HTTP method
          </label>

          <select
            id="audit-method"
            value={method}
            onChange={(event) =>
              setMethod(
                event.target.value,
              )
            }
          >
            <option value="all">
              All methods
            </option>

            {METHODS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ),
            )}
          </select>

          <label className="sr-only" htmlFor="audit-status">
            Result status
          </label>

          <select
            id="audit-status"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value,
              )
            }
          >
            <option value="all">
              All results
            </option>

            <option value="success">
              2xx / 3xx
            </option>

            <option value="error">
              4xx / 5xx
            </option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-telemetry-table">
          <caption className="sr-only">
            Luviio admin audit logs
          </caption>

          <thead>
            <tr>
              <th scope="col">
                Time
              </th>
              <th scope="col">
                Method
              </th>
              <th scope="col">
                Path
              </th>
              <th scope="col">
                Status
              </th>
              <th scope="col">
                Duration
              </th>
              <th scope="col">
                Actor
              </th>
              <th scope="col">
                Request ID
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map(
                (row, index) => {
                  const code =
                    statusCodeOf(
                      row,
                    );

                  const successful =
                    isSuccessStatus(
                      code,
                    );

                  const rowKey =
                    row?.id ||
                    row?.request_id ||
                    `${row?.created_at || 'audit'}-${index}`;

                  return (
                    <tr
                      key={rowKey}
                    >
                      <td
                        data-label="Time"
                        title={text(
                          row?.created_at,
                        )}
                      >
                        <time
                          dateTime={
                            row?.created_at ||
                            undefined
                          }
                        >
                          {formatDateTime(
                            row?.created_at,
                          )}
                        </time>
                      </td>

                      <td
                        data-label="Method"
                        className="td-strong"
                      >
                        {text(
                          row?.method,
                        ).toUpperCase()}
                      </td>

                      <td
                        data-label="Path"
                        title={text(
                          row?.path,
                        )}
                      >
                        <span className="ops-path">
                          {text(
                            row?.path,
                          )}
                        </span>
                      </td>

                      <td data-label="Status">
                        <span
                          className={`admin-pill ${
                            code >= 400
                              ? 'pill-danger'
                              : successful
                                ? 'pill-success'
                                : ''
                          }`}
                        >
                          {text(
                            row?.status_code,
                          )}
                        </span>
                      </td>

                      <td data-label="Duration">
                        {durationText(
                          row?.duration_ms,
                        )}
                      </td>

                      <td
                        data-label="Actor"
                        title={text(
                          row?.actor_user_id,
                        )}
                      >
                        {compactId(
                          row?.actor_user_id,
                        )}
                      </td>

                      <td
                        data-label="Request ID"
                        title={text(
                          row?.request_id,
                        )}
                      >
                        {compactId(
                          row?.request_id,
                        )}
                      </td>
                    </tr>
                  );
                },
              )
            ) : (
              <tr>
                <td
                  colSpan={7}
                >
                  <div
                    className="admin-empty"
                    role={
                      loading
                        ? 'status'
                        : undefined
                    }
                    aria-live={
                      loading
                        ? 'polite'
                        : undefined
                    }
                  >
                    {loading
                      ? 'Loading audit logs…'
                      : 'No audit entries match the selected filters.'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}