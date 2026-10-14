import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Job } from '../types';

export const INITIAL_SEED_JOBS: Omit<Job, 'id'>[] = [
  {
    title: 'Senior Frontend Engineer (React & TypeScript)',
    company: 'Brain Station 23',
    location: 'Mohakhali, Dhaka (Hybrid)',
    type: 'Full-time',
    department: 'Engineering',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,৩০,০০০ - ৳১,৬৫,০০০ / month',
    description: 'We are seeking an experienced Senior Frontend Engineer to architect high-performance enterprise web applications for international and domestic fintech clients. You will lead UI architecture using React 19, TypeScript, and modern state management.',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'State Management'],
    preferredSkills: ['GraphQL', 'Jest', 'CI/CD', 'Web Performance'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Nusrat Jahan',
    recruiterEmail: 'nusrat.jahan@brainstation-23.com',
    applicantsCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    title: 'Full Stack AI Platform Developer',
    company: 'Pathao',
    location: 'Gulshan-1, Dhaka',
    type: 'Full-time',
    department: 'AI & Data Platforms',
    experienceLevel: 'Mid Level',
    salaryRange: '৳১,২০,০০০ - ৳১,৫০,০০০ / month',
    description: 'Join Pathao engineering team to build AI-driven dispatch routing, merchant tools, and automated customer experience microservices using Node.js, TypeScript, React, and TF-IDF/ML models.',
    requiredSkills: ['TypeScript', 'Node.js', 'Express', 'React', 'MongoDB / Firestore'],
    preferredSkills: ['Python', 'Docker', 'TF-IDF', 'Machine Learning', 'Cloud Functions'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Fahim Chowdhury',
    recruiterEmail: 'fahim.c@pathao.com',
    applicantsCount: 8,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    title: 'Cloud DevOps & Site Reliability Engineer',
    company: 'bKash Limited',
    location: 'Shadhinata Bhaban, Dhaka',
    type: 'Full-time',
    department: 'Infrastructure & SRE',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,৪০,০০০ - ৳১,৮৫,০০০ / month',
    description: 'Ensure 99.999% uptime for national mobile financial transactions processing millions of daily payments. Automate Kubernetes clusters, Terraform configurations, and multi-region failover.',
    requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD Pipelines'],
    preferredSkills: ['GCP', 'Prometheus', 'Python', 'PCI-DSS Compliance'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Kazi Mahbub',
    recruiterEmail: 'kazi.mahbub@bkash.com',
    applicantsCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    title: 'Junior Web Application Developer',
    company: 'Chaldal Limited',
    location: 'Banani, Dhaka',
    type: 'Full-time',
    department: 'Software Engineering',
    experienceLevel: 'Entry Level',
    salaryRange: '৳৪৫,০০০ - ৳৬৫,০০০ / month',
    description: 'Ideal opportunity for a motivated CSE graduate from BUET, DU, NSU, BRAC, or other institutions looking to build high-scale e-commerce logistics software using React, JavaScript, and APIs.',
    requiredSkills: ['JavaScript', 'HTML5', 'CSS3', 'React', 'Git'],
    preferredSkills: ['TypeScript', 'Tailwind CSS', 'SQL', 'REST APIs'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Nusrat Jahan',
    recruiterEmail: 'nusrat.jahan@brainstation-23.com',
    applicantsCount: 14,
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    title: 'Backend Python & Django Microservices Architect',
    company: 'TigerIT Bangladesh',
    location: 'Uttara, Dhaka (Remote Friendly)',
    type: 'Full-time',
    department: 'Core Architecture',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,৩৫,০০০ - ৳১,৭০,০০০ / month',
    description: 'Build robust asynchronous microservices using Python, Django, FastAPI, and PostgreSQL for large-scale identity verification, biometric indexing, and distributed enterprise solutions.',
    requiredSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
    preferredSkills: ['Celery', 'RabbitMQ', 'Kubernetes', 'Microservices'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Tanveer Hasan',
    recruiterEmail: 'tanveer.h@tigerit.com',
    applicantsCount: 6,
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    title: 'Machine Learning Engineer (NLP & Bengali AI Models)',
    company: 'Optimizely Bangladesh',
    location: 'Tejgaon I/A, Dhaka',
    type: 'Full-time',
    department: 'Machine Learning & AI',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,৫০,০০০ - ৳১,৯৫,০০০ / month',
    description: 'Fine-tune large language models and semantic retrieval systems for multi-language context, tokenization, TF-IDF feature extractions, and recommendation engines.',
    requiredSkills: ['Python', 'PyTorch', 'Vector Databases', 'NLP', 'TF-IDF / Embeddings'],
    preferredSkills: ['LangChain', 'LlamaIndex', 'CUDA', 'Docker'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Sabrina Islam',
    recruiterEmail: 'sabrina.islam@optimizely.com',
    applicantsCount: 9,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    title: 'Cross-Platform Mobile Developer (Flutter & React Native)',
    company: 'ShopUp (RedX Logistics)',
    location: 'Bashundhara R/A, Dhaka',
    type: 'Full-time',
    department: 'Mobile Logistics',
    experienceLevel: 'Mid Level',
    salaryRange: '৳৮৫,০০০ - ৳১,২০,০০০ / month',
    description: 'Engineer responsive delivery partner and merchant applications handling package scanning, geo-location mapping, and offline-first synchronization across Bangladesh.',
    requiredSkills: ['Flutter / React Native', 'Dart / TypeScript', 'Mobile UI/UX', 'REST APIs', 'Git'],
    preferredSkills: ['State Management', 'Google Maps Platform', 'Offline SQLite', 'Jest'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Fahim Chowdhury',
    recruiterEmail: 'fahim.c@pathao.com',
    applicantsCount: 7,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    title: 'Cybersecurity & FinTech SOC Analyst',
    company: 'Nagad Digital Financial Services',
    location: 'Dhanmondi, Dhaka',
    type: 'Full-time',
    department: 'Information Security',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,২৫,০০০ - ৳১,৬০,০০০ / month',
    description: 'Lead offensive vulnerability assessments, penetration testing, threat hunting, and security compliance for digital wallet transactions and mobile banking gateways.',
    requiredSkills: ['Penetration Testing', 'Network Security', 'OWASP Top 10', 'Linux Security', 'SIEM Tools'],
    preferredSkills: ['CEH / OSCP', 'Cloud Security', 'Python Scripting', 'API Security'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Tanveer Hasan',
    recruiterEmail: 'tanveer.h@tigerit.com',
    applicantsCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
  },
  {
    title: 'UI/UX Product Designer & Design Systems Lead',
    company: 'Kaz Software',
    location: 'Mirpur DOHS, Dhaka',
    type: 'Full-time',
    department: 'Product Design',
    experienceLevel: 'Senior Level',
    salaryRange: '৳৯৫,০০০ - ৳১,৩০,০০০ / month',
    description: 'Design world-class web and mobile interfaces for global software clients. Build reusable Figma tokenized design systems, user flows, and wireframes.',
    requiredSkills: ['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Wireframing'],
    preferredSkills: ['Tailwind CSS', 'Prototyping', 'Accessibility (WCAG)', 'Micro-interactions'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Sabrina Islam',
    recruiterEmail: 'sabrina.islam@optimizely.com',
    applicantsCount: 11,
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    title: 'Big Data Engineer (Apache Spark & Kafka Pipelines)',
    company: 'Dynamic Solution Innovators (DSi)',
    location: 'Mohakhali DOHS, Dhaka',
    type: 'Full-time',
    department: 'Data Platforms',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,৪০,০০০ - ৳১,৭৫,০০০ / month',
    description: 'Design and optimize data pipelines processing streaming events using Apache Spark, Kafka, and PostgreSQL for large enterprise analytics platforms in healthcare and telecom.',
    requiredSkills: ['Apache Spark', 'Kafka', 'SQL', 'Python', 'Data Warehousing'],
    preferredSkills: ['Airflow', 'Docker', 'PostgreSQL Optimization', 'dbt'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Kazi Mahbub',
    recruiterEmail: 'kazi.mahbub@bkash.com',
    applicantsCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    title: 'QA Automation Engineer (Playwright & API Testing)',
    company: 'Therap (BD) Ltd.',
    location: 'Banasree, Dhaka',
    type: 'Full-time',
    department: 'Quality Assurance',
    experienceLevel: 'Mid Level',
    salaryRange: '৳৭৫,০০০ - ৳১,০৫,০০০ / month',
    description: 'Develop automated test automation suites with Playwright, TypeScript, and CI/CD pipelines for mission-critical electronic health records serving millions globally.',
    requiredSkills: ['Playwright', 'TypeScript', 'API Testing', 'CI/CD Pipelines', 'Git'],
    preferredSkills: ['Cypress', 'Postman', 'Performance Testing', 'Docker'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Nusrat Jahan',
    recruiterEmail: 'nusrat.jahan@brainstation-23.com',
    applicantsCount: 12,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    title: 'Golang Distributed Cloud Systems Engineer',
    company: 'SELISE Digital Platforms Bangladesh',
    location: 'Nikunja-2, Dhaka',
    type: 'Full-time',
    department: 'Systems Engineering',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,৩৫,০০০ - ৳১,৭০,০০০ / month',
    description: 'Engineer high-throughput gRPC services and cloud platforms using Golang. Optimize concurrency with goroutines, distributed caching, and container orchestration.',
    requiredSkills: ['Golang', 'gRPC / Protocol Buffers', 'Microservices', 'Docker', 'PostgreSQL'],
    preferredSkills: ['Kubernetes', 'Redis', 'Kafka', 'Prometheus'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Tanveer Hasan',
    recruiterEmail: 'tanveer.h@tigerit.com',
    applicantsCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    title: 'Technical Product Manager (Digital Commerce & FinTech)',
    company: 'Grameenphone Digital Services',
    location: 'GPHouse, Bashundhara, Dhaka',
    type: 'Full-time',
    department: 'Digital Product',
    experienceLevel: 'Lead',
    salaryRange: '৳১,৬০,০০০ - ৳২,১৫,০০০ / month',
    description: 'Drive the product vision and customer journey for MyGP app features, telco-fintech integrations, and value-added consumer digital services serving 80M+ subscribers.',
    requiredSkills: ['Product Roadmap', 'Agile / Scrum', 'Technical Writing', 'Data Analysis', 'User Stories'],
    preferredSkills: ['FinTech Knowledge', 'API Architecture', 'Jira', 'A/B Testing'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Sabrina Islam',
    recruiterEmail: 'sabrina.islam@optimizely.com',
    applicantsCount: 8,
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    title: 'Full Stack MERN Developer (Healthcare Systems)',
    company: 'Sheba.xyz',
    location: 'Banani DOHS, Dhaka',
    type: 'Full-time',
    department: 'Web Platforms',
    experienceLevel: 'Mid Level',
    salaryRange: '৳৮০,০০০ - ৳১,১৫,০০০ / month',
    description: 'Engineer service marketplace platforms and booking portals using React, Node.js, Express, and MongoDB. Connect payment gateways (bKash, Nagad, SSLCommerz).',
    requiredSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'REST APIs'],
    preferredSkills: ['Payment Gateway Integration', 'Tailwind CSS', 'Redux', 'Docker'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Fahim Chowdhury',
    recruiterEmail: 'fahim.c@pathao.com',
    applicantsCount: 10,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    title: 'Junior Data Analyst & Business Intelligence Specialist',
    company: 'Robi Axiata Limited',
    location: 'Gulshan-2, Dhaka',
    type: 'Full-time',
    department: 'Business Analytics',
    experienceLevel: 'Entry Level',
    salaryRange: '৳৫০,০০০ - ৳৭০,০০০ / month',
    description: 'Analyze telecom customer churn, regional data usage, and revenue metrics. Write optimized SQL queries, produce Tableau dashboards, and generate executive summaries.',
    requiredSkills: ['SQL', 'Excel / Advanced Spreadsheets', 'Data Visualization', 'Python Basics', 'Statistics'],
    preferredSkills: ['Tableau', 'PowerBI', 'Pandas', 'PostgreSQL'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Nusrat Jahan',
    recruiterEmail: 'nusrat.jahan@brainstation-23.com',
    applicantsCount: 18,
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    title: 'Embedded Systems & IoT Firmware Developer',
    company: 'Walton Hi-Tech Industries PLC',
    location: 'Chandra, Gazipur (Hybrid)',
    type: 'Full-time',
    department: 'Smart Hardware & IoT',
    experienceLevel: 'Mid Level',
    salaryRange: '৳৭০,০০০ - ৳১,০০,০০০ / month',
    description: 'Develop low-power C/C++ firmware and RTOS applications for smart inverter appliances, microcontrollers, and IoT sensor gateways deployed nationwide.',
    requiredSkills: ['Embedded C/C++', 'RTOS', 'Microcontrollers (STM32/ESP32)', 'IoT Protocols (MQTT)', 'Hardware Debugging'],
    preferredSkills: ['PCB Design Basics', 'Bluetooth/BLE', 'Python Scripting', 'Git'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Kazi Mahbub',
    recruiterEmail: 'kazi.mahbub@bkash.com',
    applicantsCount: 6,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    title: 'Principal Software Architect (Distributed Systems)',
    company: 'Enosis Solutions',
    location: 'Uttara Model Town, Dhaka',
    type: 'Full-time',
    department: 'Core Architecture',
    experienceLevel: 'Lead',
    salaryRange: '৳১,৮০,০০০ - ৳২,৫০,০০০ / month',
    description: 'Architect mission-critical distributed systems and enterprise cloud platforms for US and North American tech clients. Lead technical vision, software patterns, and high-concurrency microservices.',
    requiredSkills: ['System Design', 'Java / Spring Boot', 'Microservices', 'AWS Cloud', 'Distributed Caching'],
    preferredSkills: ['Kafka', 'Kubernetes', 'Clean Architecture', 'CI/CD'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Ashiqur Rahman',
    recruiterEmail: 'ashiqur.r@enosisbd.com',
    applicantsCount: 7,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    title: 'Senior React & Node.js Engineer (FinTech Platform)',
    company: 'Cefalo Bangladesh Ltd.',
    location: 'Dhanmondi, Dhaka (Hybrid)',
    type: 'Full-time',
    department: 'Nordic Product Engineering',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,৪৫,০০০ - ৳১,৮৫,০০০ / month',
    description: 'Work with Scandinavian media and fintech companies on modern web architecture using React 19, TypeScript, Next.js, and Node.js. High focus on code quality, automated testing, and agile workflows.',
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Jest / Testing Library'],
    preferredSkills: ['GraphQL', 'Tailwind CSS', 'Docker', 'REST APIs'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Farhana Yeasmin',
    recruiterEmail: 'farhana.y@cefalo.com',
    applicantsCount: 11,
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    title: 'Android & Payment Security Engineer',
    company: 'Kona Software Lab Limited',
    location: 'Gulshan-1, Dhaka',
    type: 'Full-time',
    department: 'Smart Payment Solutions',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,৪০,০০০ - ৳১,৭৫,০০০ / month',
    description: 'Design EMV smart card and NFC mobile payment solutions compliant with international financial protocols. Engineer secure Android applications with hardware-backed keystores and cryptography.',
    requiredSkills: ['Android SDK', 'Kotlin / Java', 'Cryptography', 'Payment Protocols (EMV/NFC)', 'Mobile Security'],
    preferredSkills: ['C/C++ NDK', 'Smart Cards', 'Reverse Engineering Protection'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Tanveer Hasan',
    recruiterEmail: 'tanveer.h@tigerit.com',
    applicantsCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    title: 'Full Stack Remote Software Engineer',
    company: 'Apploye Bangladesh',
    location: 'Sylhet / Remote (Bangladesh)',
    type: 'Remote',
    department: 'SaaS Platforms',
    experienceLevel: 'Mid Level',
    salaryRange: '৳৮০,০০০ - ৳১,১৫,০০০ / month',
    description: 'Work on time-tracking and productivity SaaS software serving 50k+ global organizations. Tech stack includes Vue/React, Node.js, PostgreSQL, and Electron desktop applications.',
    requiredSkills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'PostgreSQL'],
    preferredSkills: ['Electron', 'WebSockets', 'Redis', 'Docker'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Ashiqur Rahman',
    recruiterEmail: 'ashiqur.r@enosisbd.com',
    applicantsCount: 9,
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    title: 'Regional Tech Lead & Cloud Systems',
    company: 'Portonics Limited',
    location: 'Agrabad C/A, Chittagong',
    type: 'Full-time',
    department: 'Enterprise Logistics',
    experienceLevel: 'Senior Level',
    salaryRange: '৳১,৩০,০০০ - ৳১,৬৫,০০০ / month',
    description: 'Direct the technical engineering for port management, shipping logistics, and freight tracking platforms based in Chittagong commercial hub with cloud APIs and real-time telemetry.',
    requiredSkills: ['Cloud Architecture', 'Python / Node.js', 'PostgreSQL', 'Docker', 'API Gateway'],
    preferredSkills: ['IoT Gateways', 'GIS Mapping', 'Kubernetes'],
    status: 'open',
    recruiterId: 'recruiter_system_seed',
    recruiterName: 'Farhana Yeasmin',
    recruiterEmail: 'farhana.y@cefalo.com',
    applicantsCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  }
];

export async function getJobs(): Promise<Job[]> {
  const path = 'jobs';
  try {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Job));

    // Ensure all displayed jobs are Bangladesh-based
    const nonBdJobs = jobs.filter(j => 
      !j.location?.includes('Dhaka') && 
      !j.location?.includes('Gazipur') && 
      !j.location?.includes('Chittagong') && 
      !j.location?.includes('Sylhet') && 
      !j.location?.includes('Bangladesh')
    );

    // If there are non-Bangladesh mock jobs, purge them
    if (nonBdJobs.length > 0) {
      for (const j of nonBdJobs) {
        try {
          await deleteDoc(doc(db, 'jobs', j.id));
        } catch {
          // ignore cleanup errors
        }
      }
    }

    const validBdJobs = jobs.filter(j => 
      j.location?.includes('Dhaka') || 
      j.location?.includes('Gazipur') || 
      j.location?.includes('Chittagong') || 
      j.location?.includes('Sylhet') || 
      j.location?.includes('Bangladesh')
    );

    if (validBdJobs.length < 10) {
      const seeded = await seedInitialJobs();
      return seeded;
    }

    return validBdJobs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function seedInitialJobs(): Promise<Job[]> {
  const seededJobs: Job[] = [];

  try {
    for (const job of INITIAL_SEED_JOBS) {
      const docRef = await addDoc(collection(db, 'jobs'), job);
      seededJobs.push({ id: docRef.id, ...job });
    }
  } catch (err) {
    console.warn('Seeding note:', err);
  }
  return seededJobs;
}

export async function getJobById(id: string): Promise<Job | null> {
  const path = `jobs/${id}`;
  try {
    const snap = await getDoc(doc(db, 'jobs', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Job;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createJob(jobData: Omit<Job, 'id'>): Promise<string> {
  const path = 'jobs';
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...jobData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<void> {
  const path = `jobs/${id}`;
  try {
    await updateDoc(doc(db, 'jobs', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteJob(id: string): Promise<void> {
  const path = `jobs/${id}`;
  try {
    await deleteDoc(doc(db, 'jobs', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
