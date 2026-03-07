import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>🌿 Agroplaga AI</div>
      <ul style={styles.navLinks}>
        <li><Link to="/" style={styles.link}>🏠 Dashboard</Link></li>
        <li><Link to="/plagas" style={styles.link}>🪰 Plagas</Link></li>
         <li><Link to="/parcelas" style={styles.link}>🌾 Parcelas</Link></li>
        <li><Link to="/seguimiento" style={styles.link}>📘 Seguimiento</Link></li>
        <li><Link to="/nueva-plaga" style={styles.link}>➕ Nueva Plaga</Link></li>
        <li><Link to="/chat" style={styles.link}> AGROIA</Link></li>
      </ul>
    </nav>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#40916c',
    padding: '1rem 2rem',
    color: 'white',
    flexWrap: 'wrap'
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '1.2rem'
  },
  navLinks: {
    display: 'flex',
    listStyle: 'none',
    gap: '1rem',
    margin: 0,
    padding: 0
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontWeight: 'bold'
  }
};

export default Navbar;
