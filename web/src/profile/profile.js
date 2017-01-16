import React from 'react';
import { Link } from 'react-router';
import { BRAND_LIGHT, LIGHT_TEXT, MUTED_TEXT, DANGER } from '../chrome/colors';
import './profile.css';

export default ({ params: { storeId } }) => (
  <div>
    <div className="profile-badge" style={{ borderColor: MUTED_TEXT }}>
      <div className="profile-badge-image" style={{ background: BRAND_LIGHT, color: LIGHT_TEXT }}>HJ</div>
      <div className="profile-badge-details">
        <div className="profile-badge-details-name">Honest Jo</div>
        <div className="profile-badge-details-email">honesty-jo@example.com</div>
      </div>
      <div className="profile-badge-action">
        <Link to={`/${storeId}/profile/edit`}>Edit</Link>
      </div>
    </div>
    <ul className="profile-info" style={{ borderColor: MUTED_TEXT, color: BRAND_LIGHT }}>
      <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/info/about`}>About honesty.store</Link></li>
      <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/info/terms`}>Terms &amp; Conditions</Link></li>
      <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/info/privacy`}>Privacy Policy</Link></li>
      <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/info/app`}>App Version</Link></li>
    </ul>
    <ul className="profile-actions" style={{ borderColor: MUTED_TEXT, color: DANGER }}>
      <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/profile/logout`}>Log Out</Link></li>
      <li style={{ borderColor: MUTED_TEXT }}><Link to={`/${storeId}/profile/close`}>Close Account</Link></li>
    </ul>
  </div>
);