import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  RiBuilding4Line,
  RiCloseLine,
  RiContactsLine,
  RiEraserLine,
  RiFileShield2Line,
  RiImageAddLine,
  RiRefreshLine,
  RiSave3Line,
  RiShieldCheckLine,
  RiUploadCloud2Line,
  RiUserStarLine,
  RiEditLine,
} from '@remixicon/react';

import { adminService } from '../../services/admin';
import { useToast } from '../../context/ToastContext';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ADDRESS_KEYS = new Set([
  'seller_address_line1',
  'seller_address_line2',
  'seller_city',
  'seller_district',
  'seller_state',
  'seller_state_code',
  'seller_pincode',
  'seller_country',
]);

const FIELDS = [
  {
    section: 'Business identity',
    icon: RiBuilding4Line,
    description:
      'The identity used across your storefront and business documents.',
    items: [
      [
        'business_brand_name',
        'Brand name',
        'e.g. Luviio',
        false,
      ],
      [
        'business_legal_name',
        'Legal / business name',
        'Name used on legal documents',
        true,
      ],
      [
        'business_type',
        'Business type',
        'e.g. Sole proprietor, partnership, company',
        false,
      ],
      [
        'business_website',
        'Website',
        'e.g. https://luviio.in',
        false,
      ],
    ],
  },
  {
    section: 'Brand assets',
    icon: RiImageAddLine,
    description:
      'Upload the assets that can appear on newly issued invoices.',
    items: [],
  },
  {
    section: 'Contact details',
    icon: RiContactsLine,
    description:
      'Primary contact information for your business.',
    items: [
      [
        'business_email',
        'Business email',
        'Primary business email',
        false,
      ],
      [
        'business_phone',
        'Business phone',
        'Primary business phone',
        false,
      ],
    ],
  },
  {
    section: 'Seller address',
    icon: RiBuilding4Line,
    description:
      'The seller address used for invoice and tax documents.',
    items: [
      [
        'seller_address_line1',
        'Address line 1',
        'Registered / seller address',
        true,
      ],
      [
        'seller_address_line2',
        'Address line 2',
        'Optional',
        false,
      ],
      [
        'seller_city',
        'City',
        'e.g. Delhi',
        true,
      ],
      [
        'seller_district',
        'District',
        'e.g. Delhi',
        false,
      ],
      [
        'seller_state',
        'State',
        'e.g. Delhi',
        true,
      ],
      [
        'seller_state_code',
        'State code',
        'GST state code, e.g. DL',
        true,
      ],
      [
        'seller_pincode',
        'Pincode',
        '6-digit pincode',
        true,
      ],
      [
        'seller_country',
        'Country',
        'e.g. India',
        true,
      ],
    ],
  },
  {
    section: 'Tax & legal',
    icon: RiFileShield2Line,
    description:
      'Tax identity used when issuing compliant business invoices.',
    items: [
      [
        'seller_gst_registered',
        'GST registration',
        '',
        true,
      ],
      [
        'seller_gstin',
        'GSTIN',
        'Required when GST registration is enabled',
        true,
      ],
      [
        'seller_pan',
        'PAN',
        'Seller PAN',
        false,
      ],
    ],
  },
  {
    section: 'Authorised signatory',
    icon: RiUserStarLine,
    description:
      'Optional signature identity shown on newly issued invoices.',
    items: [
      [
        'business_authorised_signatory_name',
        'Signatory name',
        'Name printed on the invoice',
        false,
      ],
      [
        'business_authorised_signatory_designation',
        'Designation',
        'e.g. Proprietor, Partner, Director',
        false,
      ],
    ],
  },
];

const createInitialValues = () =>
  Object.fromEntries(
    FIELDS.flatMap((group) =>
      group.items.map(([key]) => [key, '']),
    ),
  );

const unwrap = (response) =>
  response?.data?.data ||
  response?.data ||
  response;

const settingsRows = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  return [];
};

const isGstRegistered = (value) =>
  value === true ||
  value === 'true';

const validateGstin = (value) =>
  /^[0-9]{2}[A-Z0-9]{10}[0-9A-Z]{3}$/i.test(
    String(value || '').trim(),
  );

const validatePincode = (value) =>
  /^\d{6}$/.test(
    String(value || '').trim(),
  );

function SignaturePad({
  onSaved,
  onError,
}) {
  const canvasRef =
    useRef(null);

  const drawingRef =
    useRef(false);

  const lastPointRef =
    useRef({ x: 0, y: 0 });

  const [busy, setBusy] =
    useState(false);

  const setupCanvas =
    useCallback(() => {
      const canvas =
        canvasRef.current;

      if (!canvas) return;

      const rect =
        canvas.getBoundingClientRect();

      const ratio = Math.max(
        window.devicePixelRatio || 1,
        1,
      );

      canvas.width = Math.round(
        rect.width * ratio,
      );

      canvas.height = Math.round(
        rect.height * ratio,
      );

      const ctx =
        canvas.getContext('2d');

      if (!ctx) return;

      ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0,
      );

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.2;
    }, []);

  useEffect(() => {
    setupCanvas();

    const handleResize = () => {
      /*
       * Do not silently redraw a signature after resize.
       * The editor is intentionally reset so the canvas
       * cannot upload a visually stale raster.
       */
      setupCanvas();
    };

    window.addEventListener(
      'resize',
      handleResize,
    );

    return () =>
      window.removeEventListener(
        'resize',
        handleResize,
      );
  }, [setupCanvas]);

  const getPoint = useCallback(
    (event) => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return {
          x: 0,
          y: 0,
        };
      }

      const rect =
        canvas.getBoundingClientRect();

      return {
        x:
          event.clientX -
          rect.left,
        y:
          event.clientY -
          rect.top,
      };
    },
    [],
  );

  const handlePointerDown =
    useCallback(
      (event) => {
        const canvas =
          canvasRef.current;

        if (!canvas || busy) return;

        event.preventDefault();

        drawingRef.current = true;

        lastPointRef.current =
          getPoint(event);

        canvas.setPointerCapture?.(
          event.pointerId,
        );
      },
      [busy, getPoint],
    );

  const handlePointerMove =
    useCallback(
      (event) => {
        if (
          !drawingRef.current ||
          busy
        ) {
          return;
        }

        event.preventDefault();

        const canvas =
          canvasRef.current;

        if (!canvas) return;

        const point =
          getPoint(event);

        const ctx =
          canvas.getContext('2d');

        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(
          lastPointRef.current.x,
          lastPointRef.current.y,
        );
        ctx.lineTo(
          point.x,
          point.y,
        );
        ctx.stroke();

        lastPointRef.current =
          point;
      },
      [busy, getPoint],
    );

  const stopDrawing =
    useCallback(() => {
      drawingRef.current =
        false;
    }, []);

  const clear =
    useCallback(() => {
      const canvas =
        canvasRef.current;

      if (!canvas) return;

      const ctx =
        canvas.getContext('2d');

      if (!ctx) return;

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }, []);

  const save =
    useCallback(async () => {
      const canvas =
        canvasRef.current;

      if (!canvas || busy) {
        return;
      }

      const blob =
        await new Promise((resolve) =>
          canvas.toBlob(
            resolve,
            'image/png',
          ),
        );

      if (!blob) {
        onError(
          new Error(
            'Unable to prepare the signature image.',
          ),
        );
        return;
      }

      setBusy(true);

      try {
        const file =
          new File(
            [blob],
            'authorised-signature.png',
            {
              type: 'image/png',
            },
          );

        const result = unwrap(
          await adminService.uploadBusinessSignature(
            file,
          ),
        );

        const url =
          result?.url ||
          result?.setting?.value ||
          '';

        if (!url) {
          throw new Error(
            'Signature upload completed without a saved asset reference.',
          );
        }

        onSaved(url);
      } catch (error) {
        onError(error);
      } finally {
        setBusy(false);
      }
    }, [
      busy,
      onError,
      onSaved,
    ]);

  return (
    <div className="signature-editor grid min-w-0 gap-2.5">
      <div className="signature-canvas-wrap relative h-[150px] w-full overflow-hidden rounded-xl border border-line bg-white touch-none max-[700px]:h-[170px]">
        <div className="signature-guide pointer-events-none absolute inset-x-3 bottom-[34px] z-0 border-b border-dashed border-[#cfcfcf] text-right text-[9px] leading-none text-[#999]">
          Sign inside this area
        </div>

        <canvas
          ref={canvasRef}
          className="signature-canvas relative z-[1] block h-full w-full cursor-crosshair touch-none"
          aria-label="Authorised signature drawing area"
          onPointerDown={
            handlePointerDown
          }
          onPointerMove={
            handlePointerMove
          }
          onPointerUp={stopDrawing}
          onPointerCancel={
            stopDrawing
          }
          onPointerLeave={
            stopDrawing
          }
        />
      </div>

      <div className="asset-actions flex flex-wrap justify-end gap-2 max-[700px]:justify-stretch [&_.btn]:max-[700px]:flex-1">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-transparent px-4 text-xs font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          type="button"
          onClick={clear}
          disabled={busy}
        >
          <RiEraserLine
            size={16}
            aria-hidden="true"
          />
          Clear
        </button>

        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={save}
          disabled={busy}
          aria-busy={busy}
        >
          <RiSave3Line
            size={16}
            aria-hidden="true"
          />
          {busy
            ? 'Saving…'
            : 'Save signature'}
        </button>
      </div>
    </div>
  );
}

export default function BusinessProfilePanel() {
  const { toast } =
    useToast();

  const [
    values,
    setValues,
  ] = useState(
    createInitialValues,
  );

  const [
    original,
    setOriginal,
  ] = useState(
    createInitialValues,
  );

  const [
    logoUrl,
    setLogoUrl,
  ] = useState('');

  const [
    signatureUrl,
    setSignatureUrl,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    assetBusy,
    setAssetBusy,
  ] = useState(false);

  const [
    editingAddress,
    setEditingAddress,
  ] = useState(false);

  const logoInput =
    useRef(null);

  const mountedRef =
    useRef(true);

  const loadRequestRef =
    useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current =
        false;

      loadRequestRef.current += 1;
    };
  }, []);

  const gstRegistered =
    isGstRegistered(
      values.seller_gst_registered,
    );

  const dirty =
    useMemo(
      () =>
        Object.keys(values).some(
          (key) =>
            String(
              values[key] ?? '',
            ) !==
            String(
              original[key] ?? '',
            ),
        ),
      [values, original],
    );

  const load =
    useCallback(async () => {
      const requestId =
        ++loadRequestRef.current;

      setLoading(true);

      try {
        const [
          general,
          financial,
        ] = await Promise.all([
          adminService.settings(
            'general',
          ),
          adminService.settings(
            'financial',
          ),
        ]);

        if (
          !mountedRef.current ||
          requestId !==
            loadRequestRef.current
        ) {
          return;
        }

        const rows = [
          ...settingsRows(general),
          ...settingsRows(financial),
        ];

        const next =
          createInitialValues();

        let nextLogo = '';
        let nextSignature = '';

        for (const row of rows) {
          if (
            Object.prototype.hasOwnProperty.call(
              next,
              row?.key,
            )
          ) {
            next[row.key] =
              row?.value ?? '';
          }

          if (
            row?.key ===
            'business_logo_url'
          ) {
            nextLogo =
              row?.value || '';
          }

          if (
            row?.key ===
            'business_signature_url'
          ) {
            nextSignature =
              row?.value || '';
          }
        }

        setValues(next);
        setOriginal({
          ...next,
        });
        setLogoUrl(nextLogo);
        setSignatureUrl(
          nextSignature,
        );
        setEditingAddress(false);
      } catch (error) {
        if (
          !mountedRef.current ||
          requestId !==
            loadRequestRef.current
        ) {
          return;
        }

        toast.error(
          error?.message ||
            'Unable to load business profile.',
        );
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            loadRequestRef.current
        ) {
          setLoading(false);
        }
      }
    }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setValue =
    useCallback(
      (key, value) => {
        setValues(
          (current) => ({
            ...current,
            [key]: value,
          }),
        );
      },
      [],
    );

  const save =
    useCallback(async () => {
      const legalName =
        String(
          values.business_legal_name ||
            '',
        ).trim();

      const requiredAddress = [
        'seller_address_line1',
        'seller_city',
        'seller_state',
        'seller_pincode',
        'seller_country',
      ];

      if (!legalName) {
        toast.error(
          'Legal / business name is required.',
        );
        return;
      }

      const missingAddress =
        requiredAddress.some(
          (key) =>
            !String(
              values[key] || '',
            ).trim(),
        );

      if (missingAddress) {
        toast.error(
          'Complete the required seller address fields before saving.',
        );
        return;
      }

      if (
        !validatePincode(
          values.seller_pincode,
        )
      ) {
        toast.error(
          'Enter a valid 6-digit seller pincode.',
        );
        return;
      }

      if (
        gstRegistered &&
        !String(
          values.seller_gstin || '',
        ).trim()
      ) {
        toast.error(
          'GSTIN is required when GST registration is enabled.',
        );
        return;
      }

      if (
        gstRegistered &&
        !validateGstin(
          values.seller_gstin,
        )
      ) {
        toast.error(
          'Enter a valid 15-character GSTIN.',
        );
        return;
      }

      const changedKeys =
        Object.keys(values).filter(
          (key) =>
            String(
              values[key] ?? '',
            ) !==
            String(
              original[key] ?? '',
            ),
        );

      if (
        changedKeys.length === 0
      ) {
        toast.info(
          'No business profile changes to save.',
        );
        return;
      }

      setSaving(true);

      try {
        for (const key of changedKeys) {
          const value =
            key ===
            'seller_gst_registered'
              ? isGstRegistered(
                  values[key],
                )
              : String(
                  values[key] ?? '',
                ).trim();

          await adminService.updateSetting(
            key,
            value,
            'Updated Business Profile from admin console',
          );
        }

        await load();

        if (
          mountedRef.current
        ) {
          setEditingAddress(false);
          toast.success(
            'Business profile saved.',
          );
        }
      } catch (error) {
        if (
          mountedRef.current
        ) {
          toast.error(
            error?.message ||
              'Unable to save business profile.',
          );
        }
      } finally {
        if (
          mountedRef.current
        ) {
          setSaving(false);
        }
      }
    }, [
      values,
      original,
      gstRegistered,
      load,
      toast,
    ]);

  const uploadLogo =
    useCallback(
      async (event) => {
        const input =
          event.currentTarget;

        const file =
          input.files?.[0];

        input.value = '';

        if (!file) return;

        if (
          !file.type.startsWith(
            'image/',
          )
        ) {
          toast.error(
            'Please choose an image file.',
          );
          return;
        }

        if (
          file.size >
          MAX_IMAGE_SIZE
        ) {
          toast.error(
            'Logo must be 5 MB or smaller.',
          );
          return;
        }

        setAssetBusy(true);

        try {
          const result =
            unwrap(
              await adminService.uploadBusinessLogo(
                file,
              ),
            );

          const url =
            result?.url ||
            result?.setting?.value ||
            '';

          if (!url) {
            throw new Error(
              'Logo upload completed without a saved asset reference.',
            );
          }

          if (
            mountedRef.current
          ) {
            setLogoUrl(url);
            toast.success(
              'Business logo uploaded.',
            );
          }
        } catch (error) {
          if (
            mountedRef.current
          ) {
            toast.error(
              error?.message ||
                'Unable to upload logo.',
            );
          }
        } finally {
          if (
            mountedRef.current
          ) {
            setAssetBusy(false);
          }
        }
      },
      [toast],
    );

  if (loading) {
    return (
      <section className="min-w-0">
        <div className="min-w-0 mb-[18px] rounded-xl border border-line bg-surface p-5">
          <div
            className="flex min-w-0 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-bg px-5 py-12 text-center text-muted"
            role="status"
            aria-live="polite"
          >
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-gold motion-reduce:animate-none"
              aria-hidden="true"
            >
              ●
            </span>

            <span>
              Loading business profile…
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="grid min-w-0 gap-0"
      aria-labelledby="business-profile-title"
    >
      <div className="flex min-w-0 items-center justify-between gap-6 rounded-2xl border border-line bg-surface p-6 max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-gold-soft">
            <RiShieldCheckLine
              size={15}
              aria-hidden="true"
            />
            Business settings
          </div>

          <h2 id="business-profile-title">
            Business Profile
          </h2>

          <p>
            Manage the business identity used
            for invoices, seller information
            and optional invoice branding.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-transparent px-4 text-xs font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            type="button"
            onClick={load}
            disabled={
              saving || assetBusy
            }
          >
            <RiRefreshLine
              size={16}
              aria-hidden="true"
            />
            Refresh
          </button>

          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={save}
            disabled={
              saving || !dirty
            }
            aria-busy={saving}
          >
            <RiSave3Line
              size={16}
              aria-hidden="true"
            />
            {saving
              ? 'Saving…'
              : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="mb-[18px] rounded-lg border border-line border-l-2 border-l-gold bg-surface-2 px-3.5 py-3 text-xs leading-6 text-muted [&_strong]:text-text">
        <strong>
          Before saving:
        </strong>{' '}
        Use your real legal information.
        GSTIN/PAN must be entered only when
        applicable. Logo and signature are
        uploaded directly from your device;
        no URL is required.
      </div>

      {FIELDS.map(
        ({
          section,
          icon: Icon,
          description,
          items,
        }) => (
          <div
            className="min-w-0 border-b border-line-soft bg-surface p-5 max-[700px]:p-4 last:border-b-0"
            key={section}
          >
            <div className="mb-[18px] flex min-w-0 items-center gap-3 border-b border-line-soft pb-3.5 max-[700px]:items-start">
              <div
                className="flex size-[38px] shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-gold-soft"
                aria-hidden="true"
              >
                <Icon size={19} />
              </div>

              <div>
                <h3>{section}</h3>
                <p>
                  {description}
                </p>
              </div>

              {section ===
                'Seller address' && (
                <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-transparent px-4 text-xs font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    type="button"
                    onClick={() =>
                      setEditingAddress(
                        (current) =>
                          !current,
                      )
                    }
                    disabled={saving}
                    aria-pressed={
                      editingAddress
                    }
                  >
                    {editingAddress ? (
                      <RiCloseLine
                        size={16}
                        aria-hidden="true"
                      />
                    ) : (
                      <RiEditLine
                        size={16}
                        aria-hidden="true"
                      />
                    )}

                    {editingAddress
                      ? 'Cancel edit'
                      : 'Edit address'}
                  </button>
                </div>
              )}
            </div>

            {section ===
            'Brand assets' ? (
              <div className="grid min-w-0 grid-cols-2 gap-4 max-[700px]:grid-cols-1 max-[700px]:gap-3">
                <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-line bg-surface-2 p-4">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-[.08em] leading-tight text-text">
                      Business logo
                    </div>

                    <p className="mt-1 text-[11px] leading-6 text-muted">
                      Shown on newly generated
                      invoices when uploaded.
                    </p>
                  </div>

                  <div className="flex min-h-[90px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-bg text-dim [&_img]:block [&_img]:max-h-[100px] [&_img]:max-w-[90%] [&_img]:object-contain">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Business logo preview"
                        loading="lazy"
                      />
                    ) : (
                      <span>
                        No logo uploaded
                      </span>
                    )}
                  </div>

                  <input
                    ref={logoInput}
                    className="asset-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={
                      uploadLogo
                    }
                    aria-label="Choose business logo"
                  />

                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    onClick={() =>
                      logoInput.current?.click()
                    }
                    disabled={assetBusy}
                    aria-busy={
                      assetBusy
                    }
                  >
                    <RiUploadCloud2Line
                      size={16}
                      aria-hidden="true"
                    />

                    {assetBusy
                      ? 'Uploading…'
                      : logoUrl
                        ? 'Replace logo'
                        : 'Upload from device'}
                  </button>

                  <small>
                    PNG, JPG or WebP ·
                    max 5 MB
                  </small>
                </div>

                <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-line bg-surface-2 p-4">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-[.08em] leading-tight text-text">
                      Authorised signature
                    </div>

                    <p className="mt-1 text-[11px] leading-6 text-muted">
                      Optional. Appears on
                      newly issued invoices
                      when saved.
                    </p>
                  </div>

                  {signatureUrl ? (
                    <div className="flex min-h-[76px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-white text-dim [&_img]:block [&_img]:max-h-[68px] [&_img]:max-w-[90%] [&_img]:object-contain">
                      <img
                        src={signatureUrl}
                        alt="Saved authorised signature"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[76px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-white text-dim">
                      <span>
                        No signature saved
                      </span>
                    </div>
                  )}

                  <SignaturePad
                    onSaved={(url) => {
                      setSignatureUrl(
                        url,
                      );

                      toast.success(
                        'Authorised signature saved.',
                      );
                    }}
                    onError={(error) =>
                      toast.error(
                        error?.message ||
                          'Unable to save signature.',
                      )
                    }
                  />

                  <small>
                    Sign with your finger,
                    then save. You can clear
                    and redraw before saving.
                  </small>
                </div>
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-2 gap-4 max-[700px]:grid-cols-1 max-[700px]:gap-3">
                {items.map(
                  ([
                    key,
                    label,
                    hint,
                    required,
                  ]) => {
                    if (
                      key ===
                        'seller_gstin' &&
                      !gstRegistered
                    ) {
                      return null;
                    }

                    const addressLocked =
                      ADDRESS_KEYS.has(
                        key,
                      ) &&
                      !editingAddress;

                    return (
                      <label
                        className="flex min-w-0 flex-col gap-1.5 [&>span]:flex [&>span]:items-center [&>span]:justify-between [&>span]:gap-2 [&>span]:text-[11px] [&>span]:font-bold [&>span]:uppercase [&>span]:tracking-[.08em] [&>span]:text-muted [&_em]:shrink-0 [&_em]:text-[9px] [&_em]:font-semibold [&_em]:not-italic [&_em]:normal-case [&_em]:text-gold-soft [&_input]:min-h-[42px] [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_input:disabled]:cursor-not-allowed [&_input:disabled]:opacity-60 [&_select]:min-h-[42px] [&_select]:w-full [&_select]:min-w-0 [&_select]:rounded-lg [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3 [&_select]:text-sm [&_select]:text-text [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)]"
                        key={key}
                      >
                        <span>
                          {label}

                          {required && (
                            <em>
                              Required
                            </em>
                          )}
                        </span>

                        {key ===
                        'seller_gst_registered' ? (
                          <select
                            value={
                              gstRegistered
                                ? 'true'
                                : 'false'
                            }
                            onChange={(
                              event,
                            ) =>
                              setValue(
                                key,
                                event.target
                                  .value ===
                                  'true',
                              )
                            }
                          >
                            <option value="false">
                              Not registered
                            </option>

                            <option value="true">
                              GST registered
                            </option>
                          </select>
                        ) : (
                          <input
                            value={
                              values[key] ??
                              ''
                            }
                            onChange={(
                              event,
                            ) =>
                              setValue(
                                key,
                                event.target
                                  .value,
                              )
                            }
                            placeholder={
                              hint
                            }
                            readOnly={
                              addressLocked
                            }
                            aria-readonly={
                              addressLocked
                            }
                            className={
                              addressLocked
                                ? 'address-readonly'
                                : ''
                            }
                            autoComplete={
                              key ===
                              'business_email'
                                ? 'email'
                                : key ===
                                    'business_phone'
                                  ? 'tel'
                                  : 'off'
                            }
                          />
                        )}

                        {key ===
                          'seller_gstin' &&
                          gstRegistered && (
                            <small>
                              Enter the
                              15-character
                              GSTIN exactly
                              as issued.
                            </small>
                          )}
                      </label>
                    );
                  },
                )}
              </div>
            )}
          </div>
        ),
      )}
    </section>
  );
}