import React from 'react';
import styles from './navbar.module.css';
import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>AttackTrace</Link>
      <ul className={styles.navLinks}>
        <li><Link href="/wordcloud" className={styles.navButton}>Attacker Inputs</Link></li>
        <li><Link href="/authtable" className={styles.navButton}>Auth History</Link></li>
        <li><Link href="/sankey" className={styles.navButton}>IP Insights</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;