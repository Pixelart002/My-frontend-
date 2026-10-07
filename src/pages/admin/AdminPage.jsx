                <header className="admin-head flex w-full min-w-0">
          <div className="admin-head-brand flex min-w-0 flex-1">
            <button
              type="button"
              className="admin-menu-trigger"
              aria-label={sidebarExpanded ? 'Collapse admin sidebar' : 'Expand admin sidebar'}
              aria-expanded={sidebarExpanded}
              onClick={toggleSidebar}
            >
              <RiMenuLine size={19} aria-hidden="true" />
            </button>

            <div className="admin-head-context min-w-0">
              <nav className="admin-breadcrumb min-w-0 max-w-full" aria-label="Breadcrumb">
                <span className="admin-breadcrumb-root">Luviio Admin</span>
                <span className="admin-breadcrumb-separator" aria-hidden="true">/</span>
                <span className="admin-breadcrumb-current">{active.label}</span>
              </nav>
              <span className="admin-head-caption">Operations console</span>
            </div>
          </div>

          <div className="admin-head-meta">
            <span className="admin-live-status" aria-label="Admin console online">
              <span className="admin-live-dot" aria-hidden="true" />
              <span>Live</span>
            </span>
            <span className="admin-role-chip">{currentRole || 'Staff'}</span>
          </div>
        </header>
