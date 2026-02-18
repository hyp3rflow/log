"use client";

import { useState, useMemo } from "react";
import { css } from "../../../styled-system/css";

// ─── 2026 Constants ───
const PENSION_RATE = 0.0475;
const PENSION_MIN_BASE = 390_000;
const PENSION_MAX_BASE = 6_370_000;
const HEALTH_RATE = 0.03595;
const LONG_TERM_CARE_RATIO = 0.1314;
const EMPLOYMENT_RATE = 0.009;

const TAX_BRACKETS = [
  { limit: 14_000_000, rate: 0.06, deduction: 0 },
  { limit: 50_000_000, rate: 0.15, deduction: 1_260_000 },
  { limit: 88_000_000, rate: 0.24, deduction: 5_760_000 },
  { limit: 150_000_000, rate: 0.35, deduction: 15_440_000 },
  { limit: 300_000_000, rate: 0.38, deduction: 19_940_000 },
  { limit: 500_000_000, rate: 0.40, deduction: 25_940_000 },
  { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
  { limit: Infinity, rate: 0.45, deduction: 65_940_000 },
];

// ─── Calculation helpers ───

function calcEarnedIncomeDeduction(total: number): number {
  if (total <= 5_000_000) return total * 0.7;
  if (total <= 15_000_000) return 3_500_000 + (total - 5_000_000) * 0.4;
  if (total <= 45_000_000) return 7_500_000 + (total - 15_000_000) * 0.15;
  if (total <= 100_000_000) return 12_000_000 + (total - 45_000_000) * 0.05;
  return 14_750_000 + (total - 100_000_000) * 0.02;
}

function calcIncomeTax(taxable: number): number {
  if (taxable <= 0) return 0;
  for (const b of TAX_BRACKETS) {
    if (taxable <= b.limit) return taxable * b.rate - b.deduction;
  }
  return 0;
}

function calcEarnedIncomeTaxCredit(tax: number, totalPay: number): number {
  const credit =
    tax <= 1_300_000
      ? tax * 0.55
      : 715_000 + (tax - 1_300_000) * 0.3;

  let limit: number;
  if (totalPay <= 33_000_000) {
    limit = 740_000;
  } else if (totalPay <= 70_000_000) {
    limit = Math.max(740_000 - (totalPay - 33_000_000) * 0.008, 660_000);
  } else if (totalPay <= 120_000_000) {
    limit = Math.max(660_000 - (totalPay - 70_000_000) * 0.5, 500_000);
  } else {
    limit = Math.max(500_000 - (totalPay - 120_000_000) * 0.5, 200_000);
  }
  return Math.min(credit, limit);
}

function calcChildCredit(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 150_000;
  if (n === 2) return 300_000;
  return 300_000 + (n - 2) * 300_000;
}

function calcCardDeduction(
  totalPay: number,
  credit: number,
  debit: number
): number {
  const min = totalPay * 0.25;
  if (credit + debit <= min) return 0;

  let d: number;
  if (credit >= min) {
    d = (credit - min) * 0.15 + debit * 0.3;
  } else {
    d = Math.max(0, debit - (min - credit)) * 0.3;
  }

  const cap =
    totalPay <= 70_000_000
      ? 3_000_000
      : totalPay <= 120_000_000
        ? 2_500_000
        : 2_000_000;
  return Math.min(Math.max(0, d), cap);
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

// ─── Styles ───

const inputStyle = css({
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  border: "1px solid #d0d0d0",
  borderRadius: "6px",
  outline: "none",
  fontFamily:
    "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",
  textAlign: "right",
  background: "white",
  "&:focus": {
    borderColor: "#000",
  },
});

const labelStyle = css({
  fontSize: "12px",
  color: "#666",
  marginBottom: "4px",
  display: "block",
  letterSpacing: "0.02em",
});

const counterBtnStyle = css({
  width: "32px",
  height: "32px",
  border: "1px solid #d0d0d0",
  borderRadius: "6px",
  background: "white",
  cursor: "pointer",
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
  "&:hover": { background: "#f5f5f5" },
  "&:active": { background: "#e8e8e8" },
});

// ─── Component ───

export default function TaxCalculator() {
  const [salary, setSalary] = useState(50_000_000);
  const [salaryText, setSalaryText] = useState("50,000,000");
  const [retirementIncluded, setRetirementIncluded] = useState(false);
  const [dependents, setDependents] = useState(1);
  const [children, setChildren] = useState(0);
  const [taxFree, setTaxFree] = useState(200_000);
  const [taxFreeText, setTaxFreeText] = useState("200,000");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [creditCard, setCreditCard] = useState(0);
  const [creditCardText, setCreditCardText] = useState("");
  const [debitCard, setDebitCard] = useState(0);
  const [debitCardText, setDebitCardText] = useState("");
  const [housing, setHousing] = useState(0);
  const [housingText, setHousingText] = useState("");
  const [mortgage, setMortgage] = useState(0);
  const [mortgageText, setMortgageText] = useState("");
  const [medical, setMedical] = useState(0);
  const [medicalText, setMedicalText] = useState("");
  const [education, setEducation] = useState(0);
  const [educationText, setEducationText] = useState("");

  function handleNumberInput(
    setter: (n: number) => void,
    textSetter: (s: string) => void
  ) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^\d]/g, "");
      if (raw === "") {
        setter(0);
        textSetter("");
        return;
      }
      const n = parseInt(raw);
      setter(n);
      textSetter(n.toLocaleString("ko-KR"));
    };
  }

  const r = useMemo(() => {
    const eff = retirementIncluded ? (salary * 12) / 13 : salary;
    const mGross = salary / 12;
    const tfAnnual = taxFree * 12;
    const totalPay = Math.max(0, eff - tfAnnual);
    const mTaxable = totalPay / 12;

    // 4대보험
    const pensionBase = Math.min(
      Math.max(mTaxable, PENSION_MIN_BASE),
      PENSION_MAX_BASE
    );
    const pension = Math.round(pensionBase * PENSION_RATE);
    const health = Math.round(mTaxable * HEALTH_RATE);
    const ltc = Math.round(health * LONG_TERM_CARE_RATIO);
    const employ = Math.round(mTaxable * EMPLOYMENT_RATE);
    const ins = pension + health + ltc + employ;

    // 소득공제
    const eid = calcEarnedIncomeDeduction(totalPay);
    const earnedIncome = totalPay - eid;
    const personal = 1_500_000 * dependents;
    const pensionDed = pension * 12;
    const insDed = (health + ltc + employ) * 12;
    const cardDed = calcCardDeduction(totalPay, creditCard, debitCard);
    const housingDed =
      totalPay <= 70_000_000 && housing > 0
        ? Math.min(housing, 3_000_000) * 0.4
        : 0;
    const mortgageDed = Math.min(mortgage, 18_000_000);

    const totalDed =
      personal + pensionDed + insDed + cardDed + housingDed + mortgageDed;
    const taxable = Math.max(0, earnedIncome - totalDed);

    // 산출세액
    const calcTax = calcIncomeTax(taxable);

    // 세액공제
    const eitc = calcEarnedIncomeTaxCredit(calcTax, totalPay);
    const childCr = calcChildCredit(children);
    const medCr = Math.max(0, medical - totalPay * 0.03) * 0.15;
    const eduCr = education * 0.15;
    const specialCr = medCr + eduCr;
    const stdCr = 130_000;
    const finalCr = Math.max(stdCr, specialCr);
    const totalCr = eitc + childCr + finalCr;

    const finalTax = Math.max(0, calcTax - totalCr);
    const mIncomeTax = Math.round(finalTax / 12);
    const mLocalTax = Math.round(mIncomeTax * 0.1);

    const totalMDed = ins + mIncomeTax + mLocalTax;
    const mNet = mGross - totalMDed;
    const aNet = mNet * 12;

    // 추가공제 환급 예상 (compare with base case: no advanced deductions)
    const baseCardDed = calcCardDeduction(totalPay, 0, 0);
    const baseTotalDed = personal + pensionDed + insDed + baseCardDed;
    const baseTaxable = Math.max(0, earnedIncome - baseTotalDed);
    const baseCalcTax = calcIncomeTax(baseTaxable);
    const baseEitc = calcEarnedIncomeTaxCredit(baseCalcTax, totalPay);
    const baseTotalCr = baseEitc + childCr + stdCr;
    const baseFinalTax = Math.max(0, baseCalcTax - baseTotalCr);
    const advancedSaving = Math.max(0, baseFinalTax - finalTax);

    return {
      mGross,
      totalPay,
      pension,
      health,
      ltc,
      employ,
      ins,
      eid,
      taxable,
      calcTax,
      mIncomeTax,
      mLocalTax,
      totalMDed,
      mNet,
      aNet,
      effectiveRate: salary > 0 ? ((salary - aNet) / salary) * 100 : 0,
      cardDed,
      housingDed,
      mortgageDed,
      advancedSaving,
    };
  }, [
    salary,
    retirementIncluded,
    dependents,
    children,
    taxFree,
    creditCard,
    debitCard,
    housing,
    mortgage,
    medical,
    education,
  ]);

  return (
    <div className={css({ maxWidth: "640px" })}>
      {/* Header */}
      <section className={css({ mb: "xl" })}>
        <h1
          className={css({
            fontSize: "14px",
            fontWeight: 400,
            mb: "2px",
          })}
        >
          연봉 실수령액 계산기
        </h1>
        <p className={css({ color: "textMuted", fontSize: "12px" })}>
          2026년 세법 기준
        </p>
      </section>

      {/* Inputs */}
      <section className={css({ mb: "lg" })}>
        {/* Salary */}
        <div className={css({ mb: "md" })}>
          <label className={labelStyle}>연봉</label>
          <div className={css({ display: "flex", alignItems: "center", gap: "8px" })}>
            <input
              type="text"
              inputMode="numeric"
              value={salaryText}
              onChange={handleNumberInput(setSalary, setSalaryText)}
              className={inputStyle}
              style={{ flex: 1 }}
            />
            <span className={css({ fontSize: "13px", color: "textMuted", flexShrink: 0 })}>
              원
            </span>
          </div>
          <div className={css({ mt: "6px", display: "flex", gap: "6px" })}>
            {[3000, 4000, 5000, 6000, 8000, 10000].map((v) => (
              <button
                key={v}
                onClick={() => {
                  setSalary(v * 10000);
                  setSalaryText(fmt(v * 10000));
                }}
                className={css({
                  fontSize: "11px",
                  padding: "3px 8px",
                  border: "1px solid #d0d0d0",
                  borderRadius: "4px",
                  background: salary === v * 10000 ? "#000" : "white",
                  color: salary === v * 10000 ? "white" : "#666",
                  cursor: "pointer",
                  "&:hover": { borderColor: "#999" },
                })}
              >
                {(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}천
              </button>
            ))}
          </div>
        </div>

        {/* Retirement toggle */}
        <div className={css({ mb: "md" })}>
          <label className={labelStyle}>퇴직금</label>
          <div className={css({ display: "flex", gap: "0" })}>
            {[
              { label: "별도", value: false },
              { label: "포함", value: true },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setRetirementIncluded(opt.value)}
                className={css({
                  fontSize: "13px",
                  padding: "6px 16px",
                  border: "1px solid #d0d0d0",
                  background:
                    retirementIncluded === opt.value ? "#000" : "white",
                  color:
                    retirementIncluded === opt.value ? "white" : "#333",
                  cursor: "pointer",
                  "&:first-of-type": {
                    borderRadius: "6px 0 0 6px",
                  },
                  "&:last-of-type": {
                    borderRadius: "0 6px 6px 0",
                    borderLeft: "none",
                  },
                })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Family */}
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            mb: "md",
          })}
        >
          <div>
            <label className={labelStyle}>부양가족 (본인 포함)</label>
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "8px",
              })}
            >
              <button
                className={counterBtnStyle}
                onClick={() => setDependents((d) => Math.max(1, d - 1))}
              >
                -
              </button>
              <span
                className={css({
                  fontFamily: "mono",
                  fontSize: "14px",
                  minWidth: "20px",
                  textAlign: "center",
                })}
              >
                {dependents}
              </span>
              <button
                className={counterBtnStyle}
                onClick={() => setDependents((d) => d + 1)}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className={labelStyle}>20세 이하 자녀</label>
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "8px",
              })}
            >
              <button
                className={counterBtnStyle}
                onClick={() => setChildren((c) => Math.max(0, c - 1))}
              >
                -
              </button>
              <span
                className={css({
                  fontFamily: "mono",
                  fontSize: "14px",
                  minWidth: "20px",
                  textAlign: "center",
                })}
              >
                {children}
              </span>
              <button
                className={counterBtnStyle}
                onClick={() => setChildren((c) => c + 1)}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className={labelStyle}>비과세액 (월)</label>
            <div className={css({ display: "flex", alignItems: "center", gap: "4px" })}>
              <input
                type="text"
                inputMode="numeric"
                value={taxFreeText}
                onChange={handleNumberInput(setTaxFree, setTaxFreeText)}
                className={inputStyle}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className={css({
            fontSize: "12px",
            color: "textMuted",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            "&:hover": { color: "text" },
          })}
        >
          <span
            style={{
              transform: showAdvanced ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
              display: "inline-block",
            }}
          >
            ▶
          </span>
          추가 공제 항목 (연말정산)
        </button>

        {showAdvanced && (
          <div
            className={css({
              mt: "sm",
              padding: "16px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              background: "white",
            })}
          >
            <div
              className={css({
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              })}
            >
              {[
                {
                  label: "신용카드 연간 사용액",
                  value: creditCardText,
                  onChange: handleNumberInput(setCreditCard, setCreditCardText),
                },
                {
                  label: "체크카드/현금영수증 연간 사용액",
                  value: debitCardText,
                  onChange: handleNumberInput(setDebitCard, setDebitCardText),
                },
                {
                  label: "주택청약저축 연간 납입액",
                  value: housingText,
                  onChange: handleNumberInput(setHousing, setHousingText),
                },
                {
                  label: "주택담보대출 연간 이자 상환액",
                  value: mortgageText,
                  onChange: handleNumberInput(setMortgage, setMortgageText),
                },
                {
                  label: "의료비 연간 지출",
                  value: medicalText,
                  onChange: handleNumberInput(setMedical, setMedicalText),
                },
                {
                  label: "교육비 연간 지출",
                  value: educationText,
                  onChange: handleNumberInput(setEducation, setEducationText),
                },
              ].map((field) => (
                <div key={field.label}>
                  <label className={labelStyle}>{field.label}</label>
                  <div className={css({ display: "flex", alignItems: "center", gap: "4px" })}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className={inputStyle}
                    />
                    <span className={css({ fontSize: "12px", color: "textMuted", flexShrink: 0 })}>
                      원
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {r.advancedSaving > 0 && (
              <p
                className={css({
                  mt: "md",
                  fontSize: "12px",
                  color: "textMuted",
                  borderTop: "1px dashed #e0e0e0",
                  paddingTop: "12px",
                })}
              >
                추가 공제로 인한 연간 예상 절세액:{" "}
                <strong className={css({ color: "text" })}>
                  {fmt(r.advancedSaving)}원
                </strong>
              </p>
            )}
          </div>
        )}
      </section>

      {/* ─── Results (dark receipt) ─── */}
      <section
        className={css({
          background: "#111",
          color: "#e0e0e0",
          borderRadius: "12px",
          padding: "28px 24px",
          fontFamily:
            "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "13px",
          lineHeight: 1.8,
        })}
      >
        {/* Hero: Monthly Net */}
        <div
          className={css({
            textAlign: "center",
            mb: "24px",
            pb: "24px",
            borderBottom: "1px solid #333",
          })}
        >
          <div
            className={css({
              fontSize: "10px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#888",
              mb: "8px",
            })}
          >
            월 실수령액
          </div>
          <div
            className={css({
              fontSize: "32px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            })}
          >
            {fmt(r.mNet)}
            <span className={css({ fontSize: "16px", fontWeight: 400, ml: "4px" })}>
              원
            </span>
          </div>
        </div>

        {/* Bar chart */}
        <div
          className={css({
            display: "flex",
            height: "8px",
            borderRadius: "4px",
            overflow: "hidden",
            mb: "24px",
          })}
        >
          <div
            style={{
              flex: r.mNet,
              background: "#fff",
            }}
          />
          <div
            style={{
              flex: r.pension,
              background: "#6366f1",
            }}
          />
          <div
            style={{
              flex: r.health + r.ltc,
              background: "#3b82f6",
            }}
          />
          <div
            style={{
              flex: r.employ,
              background: "#06b6d4",
            }}
          />
          <div
            style={{
              flex: r.mIncomeTax,
              background: "#f59e0b",
            }}
          />
          <div
            style={{
              flex: r.mLocalTax,
              background: "#f97316",
            }}
          />
        </div>

        {/* Gross */}
        <Row label="총 급여 (연)" value={fmt(salary)} bold />
        {retirementIncluded && (
          <Row label="  퇴직금 제외 환산" value={fmt(r.totalPay + taxFree * 12)} sub />
        )}
        <Separator />

        {/* 4대보험 */}
        <SectionLabel>4대보험 (월)</SectionLabel>
        <Row label="· 국민연금" value={`-${fmt(r.pension)}`} color="#6366f1" />
        <Row label="· 건강보험" value={`-${fmt(r.health)}`} color="#3b82f6" />
        <Row label="· 장기요양보험" value={`-${fmt(r.ltc)}`} color="#3b82f6" />
        <Row label="· 고용보험" value={`-${fmt(r.employ)}`} color="#06b6d4" />
        <Separator />

        {/* 세금 */}
        <SectionLabel>세금 (월)</SectionLabel>
        <Row label="· 소득세" value={`-${fmt(r.mIncomeTax)}`} color="#f59e0b" />
        <Row label="· 지방소득세" value={`-${fmt(r.mLocalTax)}`} color="#f97316" />
        <Separator />

        {/* Total deductions */}
        <Row label="공제 합계 (월)" value={`-${fmt(r.totalMDed)}`} bold />
        <div className={css({ borderTop: "2px solid #444", my: "16px" })} />

        {/* Net pay */}
        <Row label="월 실수령액" value={`${fmt(r.mNet)}원`} highlight />
        <Row label="연 실수령액" value={`${fmt(r.aNet)}원`} highlight />
        <Separator />

        {/* Stats */}
        <Row label="일급 환산" value={`${fmt(r.mNet / 30)}원`} sub />
        <Row label="시급 환산" value={`${fmt(r.mNet / 209)}원`} sub />
        <Row
          label="실효 공제율"
          value={`${r.effectiveRate.toFixed(1)}%`}
          sub
        />

        {/* Deduction details */}
        {(r.cardDed > 0 || r.housingDed > 0 || r.mortgageDed > 0) && (
          <>
            <div className={css({ borderTop: "1px dashed #333", my: "16px" })} />
            <SectionLabel>적용된 추가 공제 (연)</SectionLabel>
            {r.cardDed > 0 && (
              <Row label="· 신용카드 등 소득공제" value={`-${fmt(r.cardDed)}`} sub />
            )}
            {r.housingDed > 0 && (
              <Row label="· 주택청약저축 소득공제" value={`-${fmt(r.housingDed)}`} sub />
            )}
            {r.mortgageDed > 0 && (
              <Row label="· 주택담보대출 이자 공제" value={`-${fmt(r.mortgageDed)}`} sub />
            )}
          </>
        )}

        {/* Disclaimer */}
        <p
          className={css({
            mt: "24px",
            pt: "16px",
            borderTop: "1px solid #222",
            fontSize: "10px",
            color: "#555",
            lineHeight: 1.6,
          })}
        >
          본 계산기는 2026년 4대보험 요율 및 소득세법을 기준으로 한 추정치이며,
          실제 원천징수액과 차이가 있을 수 있습니다. 정확한 금액은 국세청
          간이세액표를 참고하세요.
        </p>
      </section>
    </div>
  );
}

// ─── Sub-components ───

function Row({
  label,
  value,
  bold,
  sub,
  highlight,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  sub?: boolean;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div
      className={css({
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        fontSize: highlight ? "15px" : sub ? "12px" : "13px",
        fontWeight: bold || highlight ? 700 : 400,
        color: highlight ? "#fff" : sub ? "#888" : "#ccc",
        py: "1px",
      })}
    >
      <span style={{ color: color || undefined }}>{label}</span>
      <span style={{ color: highlight ? "#fff" : color || undefined }}>
        {value}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div
      className={css({
        borderTop: "1px dashed #333",
        my: "12px",
      })}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={css({
        fontSize: "10px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#666",
        mb: "4px",
        mt: "4px",
      })}
    >
      {children}
    </div>
  );
}
