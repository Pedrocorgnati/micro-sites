#!/usr/bin/env python3
"""
validate-schemas.py — Validação de schemas JSON-LD para micro-sites

Valida que:
1. Cada site tem o schema correto por categoria (LocalBusiness, Article, etc.)
2. Campos obrigatórios estão presentes (@type, name, description)
3. Estrutura está bem-formada (JSON válido)

Uso:
  python3 scripts/validate-schemas.py                  # Contra DOMAIN.com (placeholder)
  python3 scripts/validate-schemas.py meudominio.com   # Contra domínio real
  python3 scripts/validate-schemas.py --local          # Modo local (lê config.json)

Dependências: requests (opcional — modo HTTP), python3 stdlib (modo local)
"""

import sys
import json
import re
import os
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from collections import defaultdict

# Configuração de schemas esperados por categoria
EXPECTED_SCHEMAS = {
    'A': {
        'type': 'LocalBusiness',
        'required_fields': ['@type', 'name', 'address', 'telephone'],
        'name': 'Nicho Vertical'
    },
    'B': {
        # B sites use HowTo (solution to a problem) — appropriate for problem/solution landing pages
        'type': 'HowTo',
        'required_fields': ['@type', 'headline', 'datePublished'],
        'name': 'Dor/Problema'
    },
    'C': {
        'type': 'Service',
        'required_fields': ['@type', 'name', 'description'],
        'name': 'Tipo de Serviço'
    },
    'D': {
        'type': 'WebApplication',
        'required_fields': ['@type', 'name', 'applicationCategory'],
        'name': 'Ferramenta'
    },
    'E': {
        'type': 'SoftwareApplication',
        'required_fields': ['@type', 'name', 'offers'],
        'name': 'Pré-SaaS'
    },
    'F': {
        'type': 'Article',
        'required_fields': ['@type', 'headline', 'datePublished'],
        'name': 'Educativo'
    }
}

# Mapa de sites por categoria
CATEGORY_SITES = {
    'A': ['a01', 'a02', 'a03', 'a04', 'a05', 'a06', 'a07', 'a08', 'a09', 'a10'],
    'B': ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08'],
    'C': ['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08'],
    'D': ['d01', 'd02', 'd03', 'd04', 'd05'],
    'E': ['e01', 'e02', 'e03'],
    'F': ['f01', 'f02']
}

@dataclass
class SchemaValidationResult:
    slug: str
    category: str
    url: str
    found_schemas: List[Dict] = field(default_factory=list)
    expected_type: str = ''
    has_expected_type: bool = False
    missing_fields: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)

    @property
    def is_valid(self) -> bool:
        return (
            self.has_expected_type
            and len(self.missing_fields) == 0
            and len(self.errors) == 0
        )


class SchemaValidator:
    def __init__(self, domain: str = "DOMAIN.com", timeout: int = 10, local_mode: bool = False):
        self.domain = domain
        self.timeout = timeout
        self.local_mode = local_mode
        self.results: List[SchemaValidationResult] = []

        if not local_mode:
            try:
                import requests as req
                self._requests = req
                self._session = req.Session()
            except ImportError:
                print("⚠ 'requests' não instalado — usando modo local automaticamente")
                print("  Instale com: pip install requests")
                self.local_mode = True

    def fetch_html(self, slug: str) -> Optional[str]:
        """Busca HTML do site via HTTP"""
        url = f"https://{slug}.{self.domain}"
        try:
            resp = self._session.get(url, timeout=self.timeout, allow_redirects=True)
            resp.raise_for_status()
            return resp.text
        except Exception as e:
            return None

    def load_config_local(self, slug: str) -> Optional[Dict]:
        """Carrega config.json local do site para validação offline"""
        # Buscar pasta do site por slug prefix
        sites_dir = os.path.join(os.path.dirname(__file__), '..', 'sites')
        for entry in os.listdir(sites_dir):
            if entry.startswith(slug):
                config_path = os.path.join(sites_dir, entry, 'config.json')
                if os.path.exists(config_path):
                    with open(config_path, 'r', encoding='utf-8') as f:
                        return json.load(f)
        return None

    def validate_local(self, slug: str, category: str) -> SchemaValidationResult:
        """Validação offline via config.json — verifica campo 'schema' e 'localBusiness'"""
        url = f"https://{slug}.{self.domain}"
        schema_config = EXPECTED_SCHEMAS[category]
        expected_type = schema_config['type']

        config = self.load_config_local(slug)
        if not config:
            return SchemaValidationResult(
                slug=slug, category=category, url=url,
                expected_type=expected_type,
                errors=[f"config.json não encontrado para {slug}"]
            )

        # Verificar campo 'schema' do config
        config_schemas = config.get('schema', [])
        has_expected_type = expected_type in config_schemas

        # Verificar localBusiness para Cat. A
        missing_fields = []
        if category == 'A':
            lb = config.get('localBusiness', {})
            if not lb:
                missing_fields.append('localBusiness')
            else:
                if not lb.get('type'):
                    missing_fields.append('localBusiness.type')
                if not lb.get('address'):
                    missing_fields.append('localBusiness.address')
                if not lb.get('phone'):
                    missing_fields.append('localBusiness.phone')

        # Verificar SEO básico
        seo = config.get('seo', {})
        if not seo.get('title'):
            missing_fields.append('seo.title')
        if not seo.get('description'):
            missing_fields.append('seo.description')

        return SchemaValidationResult(
            slug=slug, category=category, url=url,
            found_schemas=config_schemas,
            expected_type=expected_type,
            has_expected_type=has_expected_type,
            missing_fields=missing_fields,
            errors=[]
        )

    def extract_json_ld_scripts(self, html: str) -> List[Dict]:
        """Extrai todos os blocos <script type="application/ld+json">"""
        schemas = []
        pattern = r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>'

        for match in re.finditer(pattern, html, re.DOTALL):
            json_str = match.group(1).strip()
            try:
                schema = json.loads(json_str)
                schemas.append(schema)
            except json.JSONDecodeError as e:
                print(f"  ⚠ JSON inválido: {e}")

        return schemas

    def validate_schema(self, schema: Dict, expected_type: str) -> Tuple[bool, List[str]]:
        """Valida schema contra tipo esperado"""
        errors = []
        if '@type' not in schema:
            errors.append("@type não encontrado")
            return False, errors

        schema_type = schema.get('@type')
        if isinstance(schema_type, list):
            if expected_type not in schema_type:
                errors.append(f"@type esperado {expected_type} não encontrado (tipos: {schema_type})")
                return False, errors
        else:
            if schema_type != expected_type:
                errors.append(f"@type mismatch: esperado {expected_type}, encontrado {schema_type}")
                return False, errors

        return True, errors

    def check_required_fields(self, schema: Dict, required_fields: List[str]) -> List[str]:
        """Verifica presença de campos obrigatórios"""
        missing = []
        for field_name in required_fields:
            if field_name not in schema or not schema[field_name]:
                missing.append(field_name)
        return missing

    def validate_site(self, slug: str, category: str) -> SchemaValidationResult:
        """Auditoria completa de schemas de um site"""
        if self.local_mode:
            return self.validate_local(slug, category)

        url = f"https://{slug}.{self.domain}"
        schema_config = EXPECTED_SCHEMAS[category]
        expected_type = schema_config['type']
        required_fields = schema_config['required_fields']

        html = self.fetch_html(slug)
        if not html:
            return SchemaValidationResult(
                slug=slug, category=category, url=url,
                expected_type=expected_type,
                missing_fields=required_fields,
                errors=[f"Falha ao conectar em {url}"]
            )

        schemas = self.extract_json_ld_scripts(html)

        if not schemas:
            return SchemaValidationResult(
                slug=slug, category=category, url=url,
                expected_type=expected_type,
                missing_fields=required_fields,
                errors=["Nenhum schema JSON-LD encontrado"]
            )

        has_expected_type = False
        missing_fields: List[str] = []
        errors: List[str] = []

        for schema in schemas:
            is_valid, validation_errors = self.validate_schema(schema, expected_type)
            if is_valid:
                has_expected_type = True
                missing = self.check_required_fields(schema, required_fields)
                if missing:
                    missing_fields.extend(missing)
            else:
                errors.extend(validation_errors)

        return SchemaValidationResult(
            slug=slug, category=category, url=url,
            found_schemas=schemas, expected_type=expected_type,
            has_expected_type=has_expected_type,
            missing_fields=list(set(missing_fields)),
            errors=errors
        )

    def audit_all(self) -> List[SchemaValidationResult]:
        """Auditoria de todos os 36 sites"""
        for category, sites in CATEGORY_SITES.items():
            print(f"\n--- Categoria {category} ({EXPECTED_SCHEMAS[category]['name']}) ---")
            for slug in sites:
                result = self.validate_site(slug, category)
                self.results.append(result)
                self.print_result(result)
        return self.results

    def print_result(self, result: SchemaValidationResult):
        """Imprime resultado de validação de um site"""
        status = "✓" if result.is_valid else "✗"
        print(f"  {status} {result.slug}: ", end="")
        if result.is_valid:
            print(f"schema {result.expected_type} OK")
        else:
            parts = []
            if not result.has_expected_type:
                parts.append(f"tipo {result.expected_type} não encontrado")
            if result.missing_fields:
                parts.append(f"campos faltando: {', '.join(result.missing_fields)}")
            if result.errors:
                parts.append(f"erros: {'; '.join(result.errors)}")
            print(" | ".join(parts))

    def print_summary(self) -> bool:
        """Imprime resumo da auditoria"""
        valid_count = sum(1 for r in self.results if r.is_valid)
        invalid_count = len(self.results) - valid_count

        print("\n" + "="*60)
        print("SCHEMA VALIDATION SUMMARY")
        print("="*60)
        print(f"Total de sites: {len(self.results)}")
        print(f"✓ Válidos: {valid_count}")
        print(f"✗ Inválidos: {invalid_count}")

        if invalid_count > 0:
            print("\nSITES COM ERRO:")
            for result in self.results:
                if not result.is_valid:
                    all_issues = result.errors + result.missing_fields
                    print(f"  {result.slug}: {', '.join(all_issues)}")

        print("="*60)
        return invalid_count == 0


def main():
    args = sys.argv[1:]
    local_mode = '--local' in args
    domain = next((a for a in args if not a.startswith('--')), "DOMAIN.com")

    mode_label = "LOCAL (config.json)" if local_mode else f"HTTP ({domain})"
    print(f"validate-schemas.py — Modo: {mode_label}")
    print("="*60)

    validator = SchemaValidator(domain=domain, local_mode=local_mode)
    validator.audit_all()
    success = validator.print_summary()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
