# Data Processing Agreement (DPA)

**Peluclic Grooming Solutions**

This Data Processing Agreement ("DPA") is entered into by and between the
**Data Controller** (the grooming business using Peluclic) and **Peluclic
Grooming Solutions** ("Processor"), and forms part of the Terms of Service.

This DPA complies with Article 28 of the EU General Data Protection Regulation
(GDPR — Regulation (EU) 2016/679).

---

## 1. Definitions

Capitalized terms not defined herein shall have the meaning ascribed in the
GDPR. "Personal Data" means any information relating to an identified or
identifiable natural person processed by the Processor on behalf of the
Controller.

## 2. Roles and Responsibilities

| Role | Entity | Responsibility |
|------|--------|----------------|
| **Controller** | The grooming business | Determines purposes and means of processing, obtains consent, responds to data subject requests |
| **Processor** | Peluclic Grooming Solutions | Processes personal data on documented instructions from the Controller |

## 3. Subject Matter, Nature, and Purpose

The Processor provides a pet grooming management platform (SaaS) that stores
and organizes client information, pet records, appointment data, and service
configurations. Processing is limited to what is necessary to deliver the
platform functionality as described in the Terms of Service.

## 4. Duration

This DPA is effective for the duration of the Controller's use of the Peluclic
platform. Upon termination, the Processor shall delete or return all personal
data within 90 days, unless EU or Member State law requires further storage.

## 5. Categories of Personal Data

The following categories of personal data may be processed:

| Category | Examples |
|----------|----------|
| Identification data | Name |
| Contact data | Email address, phone number, postal address |
| Pet-related data | Species, breed, date of birth, weight, sex, health notes |
| Service data | Appointment history, service preferences |
| Technical data | IP address (logged for security), session tokens |

The Processor does **not** process special categories of personal data under
Article 9 GDPR (e.g., health data, biometric data) unless voluntarily provided
by the Controller in free-text notes fields.

## 6. Data Subjects

The personal data processed concerns the following categories of data subjects:

- Clients (pet owners) of the Controller
- Employees of the Controller (for authentication purposes)

## 7. Subprocessors

The Processor may engage subprocessors for specific processing activities. A
current list is maintained below and updated with at least 30 days' notice
before any new subprocessor is engaged.

| Subprocessor | Purpose | Location | Safeguards |
|-------------|---------|----------|------------|
| **Sentry** (Functional Software, Inc.) | Error monitoring and crash reporting | USA | Standard Contractual Clauses (SCCs), DPA in place |
| **Database hosting provider** | MySQL database hosting | EEA | Encryption at rest and in transit |

The Processor shall impose data protection obligations on all subprocessors
that are at least as protective as those in this DPA.

## 8. Technical and Organizational Security Measures

The Processor implements and maintains the following security measures:

| Category | Measure |
|----------|---------|
| **Access control** | Role-based access (admin/employee), session-based authentication, Argon2 password hashing |
| **Transmission security** | TLS/HTTPS for all data in transit |
| **Input validation** | All API inputs validated against domain schemas; FTS queries sanitized against operator injection |
| **Logging and monitoring** | Structured request logging (Pino), error tracking (Sentry), PII redaction in logs |
| **Security headers** | Helmet.js (CSP, X-Frame-Options, X-Content-Type-Options, HSTS) |
| **Rate limiting** | API rate limiting (100 req/15min in production; 5 req/15min for login) |
| **Data minimization** | Query parameters stripped from logs; PII fields redacted from error reports |
| **Infrastructure** | Docker containerization with minimal base images |
| **Dependency scanning** | Snyk SAST + dependency vulnerability scanning as pre-merge gate |
| **Static analysis** | SonarQube code quality and security hotspot detection |

## 9. Breach Notification

In the event of a personal data breach, the Processor shall:

1. Notify the Controller **without undue delay** and in any event within **72
   hours** of becoming aware of the breach.
2. Provide a description of the nature of the breach, the categories and
   approximate number of data subjects and records concerned.
3. Describe the likely consequences and the measures taken or proposed to
   address the breach.
4. Cooperate with the Controller to ensure compliance with notification
   obligations to the supervisory authority and affected data subjects under
   Articles 33 and 34 GDPR.

## 10. Data Subject Rights Assistance

The Processor shall assist the Controller by implementing appropriate technical
and organizational measures to respond to requests from data subjects exercising
their rights under Chapter III of the GDPR (Articles 15–22), including:

- Right of access (Art. 15)
- Right to rectification (Art. 16)
- Right to erasure / "right to be forgotten" (Art. 17)
- Right to restriction of processing (Art. 18)
- Right to data portability (Art. 20)

The platform provides built-in functionality for data export (JSON format) and
cascade deletion to support these rights.

## 11. Audit Rights

The Controller may audit the Processor's compliance with this DPA no more than
once per calendar year, upon 30 days' written notice, during normal business
hours, and at the Controller's expense. The Processor shall make available all
information necessary to demonstrate compliance.

## 12. International Data Transfers

Personal data is stored and processed exclusively within the **European
Economic Area (EEA)**. The Processor does not transfer personal data to third
countries or international organizations. If this changes, the Processor shall
implement appropriate safeguards (e.g., Standard Contractual Clauses) and
notify the Controller in advance.

## 13. Deletion and Return of Data

Upon termination of the service:
- The Controller may export all personal data using the built-in data
  portability feature (JSON format).
- The Processor shall delete all remaining personal data within 90 days,
  unless retention is required by applicable law.
- Soft-deleted records are automatically purged according to the retention
  schedule (clients: 90 days post-deletion; appointments: 365 days).

## 14. Liability

Each party's liability under this DPA shall be subject to the limitations and
exclusions of liability set forth in the Terms of Service. Nothing in this DPA
shall limit either party's liability for breaches of data protection law that
cannot be limited by contract.

## 15. Governing Law

This DPA shall be governed by the laws of the European Union and the Member
State in which the Controller is established. Any disputes shall be subject to
the jurisdiction of the courts of that Member State.

---

**Last updated**: July 2026  
**Version**: 1.0
